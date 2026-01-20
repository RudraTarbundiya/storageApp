import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { getFileType } from '@/lib/fileUtils';

const PreviewContext = createContext();

export function PreviewProvider({ children }) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewText, setPreviewText] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);

    // Ref for aborting preview requests
    const previewAbortController = useRef(null);

    const handlePreview = useCallback(async (file, fetchConfig) => {
        const fileType = getFileType(file.extension);

        // Abort any previous preview request
        if (previewAbortController.current) {
            previewAbortController.current.abort();
        }

        // Show modal immediately with loading state
        setPreviewFile(file);
        setPreviewOpen(true);
        setPreviewLoading(true);
        setPreviewText('');

        try {
            // Revoke previous URL if exists (but not for streaming URLs)
            if (previewUrl && !previewUrl.startsWith('http://localhost')) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }

            // For video and audio, use direct streaming URL for better performance
            if (fileType === 'video' || fileType === 'audio') {
                const streamUrl = fetchConfig.streamUrl || `http://localhost:4000/file/${file._id}`;
                setPreviewUrl(streamUrl);
                setPreviewLoading(false);
            } else if (fileType === 'document') {
                const docUrl = fetchConfig.streamUrl || `http://localhost:4000/file/${file._id}`;
                const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(docUrl)}&embedded=true`;
                setPreviewUrl(viewerUrl);
                setPreviewLoading(false);
            } else {
                // Create new abort controller for this request
                previewAbortController.current = new AbortController();

                // For other file types, fetch using the provided fetcher
                // fetchConfig.fetcher should return a promise that resolves to { data: blob }
                const response = await fetchConfig.fetcher(file._id, previewAbortController.current.signal);

                const blob = response.data;
                const blobUrl = URL.createObjectURL(blob);
                setPreviewUrl(blobUrl);

                // If it's code or we might want to view it as text, also read it as text
                if (fileType === 'code' || fileType === 'other') {
                    const text = await blob.text();
                    setPreviewText(text.slice(0, 100000)); // Limit to 100kb for safety
                }

                setPreviewLoading(false);
            }
        } catch (err) {
            // Don't show error if request was aborted
            if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
                console.error('Preview failed:', err);
            }
            setPreviewLoading(false);
        }
    }, [previewUrl]);

    const closePreview = useCallback(() => {
        if (previewAbortController.current) {
            previewAbortController.current.abort();
        }
        setPreviewOpen(false);
        setPreviewLoading(false);

        // Cleanup after a small delay to allow animation
        setTimeout(() => {
            if (previewUrl && !previewUrl.startsWith('http://localhost')) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);
            setPreviewFile(null);
            setPreviewText('');
        }, 200);
    }, [previewUrl]);

    const value = {
        previewOpen,
        previewFile,
        previewUrl,
        previewText,
        previewLoading,
        handlePreview,
        closePreview
    };

    return (
        <PreviewContext.Provider value={value}>
            {children}
        </PreviewContext.Provider>
    );
}

export const usePreview = () => {
    const context = useContext(PreviewContext);
    if (!context) {
        throw new Error('usePreview must be used within a PreviewProvider');
    }
    return context;
};
