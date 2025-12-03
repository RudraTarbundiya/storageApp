import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const Home = () => {
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [per, setPer] = useState(0)
  const [editingFileName, setEditingFileName] = useState('')
  const [editingFileId, setEditingFileId] = useState('')
  const [editingDirId, setEditingDirId] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [currentDir, setCurrentDir] = useState({ id: null, name: 'Root', parentId: null })

  const BASE_URL = 'http://localhost:1234'

  const { id: directoryId } = useParams()

  // fetch directory by id (null => root)
  async function fetchData(dirId = null) {
    const url = dirId ? `${BASE_URL}/directory/${dirId}` : `${BASE_URL}/directory`
    const respose = await fetch(url)
    const content = await respose.json()
    // directory route returns directory object with files array
    setFiles(content.files || [])
    // some backends may return directories key or directories property on the dir object
    setFolders(content.directories ||  [])
    setCurrentDir({ id: content.id || null, name: content.name || 'Root', parentId: content.parentId || null })
  }
  
  useEffect(() => {
    fetchData(directoryId || null)
  }, [directoryId])

  // open file in new tab 
  function handleOpen(id){
    window.open(`${BASE_URL}/files/${id}`,'_blank')
  }

  // upload a file to current directory (backend expects raw file body and perentid header)
  async function uploadFile(e){
    const file = e.target.files[0]
    if(!file) return
    const xhr = new XMLHttpRequest()
    const url = `${BASE_URL}/files/${currentDir.id || ''}`
    xhr.open('POST', url, true)
    if (currentDir.id) xhr.setRequestHeader('filename', file.name)
    xhr.addEventListener('load', (ev)=>{
      console.log(xhr.responseText)
      setPer(0)
      fetchData(currentDir.id)
    })
    xhr.upload.addEventListener('progress', (ev)=>{
      if(ev.lengthComputable){
        const percent = (ev.loaded/ev.total)*100
        setPer(percent.toFixed(2))
      }
    })
    xhr.send(file)
  }

  //for delete file handledelete function
  async function handleDelete(fid){
    const res = await fetch(`${BASE_URL}/files/${fid}`,{ method:'DELETE' })
    if(!res.ok) console.error('Delete failed', await res.text())
    console.log(await res.json())
    fetchData(currentDir.id)
  }

  function startRename(id, name, type = 'file'){
    setEditingFileName(name)
    if(type === 'file'){
      setEditingFileId(id)
      setEditingDirId('')
    } else {
      setEditingDirId(id)
      setEditingFileId('')
    }
  }

  // Save rename for file or directory depending on which is active
  async function saveRename(){
    if(editingFileId){
      const response = await fetch(`${BASE_URL}/files/${editingFileId}`,{
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ newname: editingFileName })
      })
      if(!response.ok) console.error('File rename failed', await response.text())
      console.log(await response.json())
      setEditingFileId('')
      setEditingFileName('')
      fetchData(currentDir.id)
      return
    }
    if(editingDirId){
      const response = await fetch(`${BASE_URL}/directory/${editingDirId}`,{
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ newname: editingFileName })//newname send in body
      })
      if(!response.ok) console.error('Directory rename failed', await response.text())
      console.log(await response.json())  
      setEditingDirId('')
      setEditingFileName('')
      fetchData(currentDir.id)
      return
    }
  }

  //add folder
  async function addFolder(e){
    e.preventDefault()
    if(!newFolderName) return
    // backend's directory POST implementation may vary; attempt a basic call to create folder under storage
    const target = currentDir.id ? `${BASE_URL}/directory/${currentDir.id}` : `${BASE_URL}/directory`
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'dirname': newFolderName }
    })
    console.log(await res.json())
    if(!res.ok) console.error('Create folder failed', await res.text())
    setNewFolderName('')
    fetchData(currentDir.id)
  }

  //handle delte directory
  async function handleDeleteDir(dirId){
    window.alert('this is delete all files and folders inside this folder')
    const res = await fetch(`${BASE_URL}/directory/${dirId}`,{ method:'DELETE' })
    if(!res.ok) console.error('Delete directory failed', await res.text())
    console.log(await res.json())
    fetchData(currentDir.id)
  }

  return (
    <>
      <h1>File Server</h1> 

      <label htmlFor='fileUpload'>Upload File: </label>
      <input  id="fileUpload" type='file' placeholder='upload file' onChange={uploadFile} />
      <div>progress = {per ? per + '%' : ''}</div>
      <hr />

      <form onSubmit={addFolder}>
        <input type='text' value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder='Folder name' />
        <button type='submit'>add Folder</button>
      </form>
      <hr />


      <label htmlFor="renameInput">Rename: </label>
      <input  id="renameInput" type="text" value={editingFileName} onChange={(e)=>{setEditingFileName(e.target.value)}} />
      <button onClick={saveRename}>save</button>
      <hr />

      {// folders
        folders && folders.map((dir) => (
          <div key={dir.id}>
            <Link to={ `/directory/${dir.id}` }> {dir.name}</Link>{' '}
            <button onClick={() => startRename(dir.id, dir.name, 'dir')}>rename</button>{' '}
            <button onClick={() => handleDeleteDir(dir.id)}>delete</button>
          </div>
        ))
      }

      {// files list
        files && files.map((f) => {
          return <div key={f.id}>
            {f.name}{' '}
            <button onClick={() => handleOpen(f.id)}>open</button>{' '}
            <button onClick={() => window.open(`${BASE_URL}/files/${f.id}?action=download`, '_blank')}>download</button>{' '}
            <button onClick={() => handleDelete(f.id)}>delete</button>{' '}
            <button onClick={() => startRename(f.id, f.name, 'file')}>rename</button>
          </div>
        })
      }

    </>
  )
}

export default Home
