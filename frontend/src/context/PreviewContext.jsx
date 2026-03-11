import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { getFileType } from '@/lib/fileUtils';

const PreviewContext = createContext();

export function PreviewProvider({ children }) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewText, setPreviewText] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');

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
            // Revoke previous blob URL if exists
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }

            const directFileUrl = fetchConfig?.streamUrl || `${apiBaseUrl}/file/${file._id}`;

            // For browser-previewable content, use direct URL to avoid XHR->redirect CORS issues.
            if (fileType === 'image' || fileType === 'video' || fileType === 'audio' || fileType === 'pdf') {
                setPreviewUrl(directFileUrl);
                setPreviewLoading(false);
            } else if (fileType === 'document') {
                const docUrl = directFileUrl;
                const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(docUrl)}&embedded=true`;
                setPreviewUrl(viewerUrl);
                setPreviewLoading(false);
            } else {
                // Create new abort controller for this request
                previewAbortController.current = new AbortController();

                // For other file types, fetch using the provided fetcher
                // fetchConfig.fetcher should return a promise that resolves to { data: blob }
                const response = await fetchConfig?.fetcher?.(file._id, previewAbortController.current.signal);

                if (!response?.data) {
                    setPreviewText('Preview is not available for this file type. Please download to view.');
                    setPreviewLoading(false);
                    return;
                }

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
        setPreviewOpen(false);
        setTimeout(() => {
            setPreviewUrl(null);
            setPreviewFile(null);
        }, 200);
    }, []);

    const value = {
        previewOpen,
        previewFile,
        previewUrl,
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
