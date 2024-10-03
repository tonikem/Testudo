import Panel from './components/Panel/Panel'
import Header from './components/Header/Header'
import ListGroup from './components/ListGroup/ListGroup'
import InnerContainer from './components/InnerContainer/InnerContainer'
import NotebookContainer from './components/NotebookContainer/NotebookContainer'
import { Route, Switch } from "wouter"
import { useEffect, useState } from 'react'
import notebook from '../public/notebook.png'
import folder from '../public/folder.png'
import remove from '../public/remove.png'
import plus from '../public/plus.png'
import trash from '../public/trash.png'
import save from '../public/save.png'
import pencil from '../public/pencil.png'
import edit from '../public/edit.png'
import {
  uuidv4,
  getCookie,
  DataURL,
  onMouseClickTable,
  sendPutRequest,
  sendDeleteRequest
} from './methods/AppMethods'
import './App.css'
import AllContainer from './components/AllContainer/AllContainer'


function App() {
  // Komponentin päivittämiseen
  const [_, updateApp] = useState()

  // Varsinainen data
  const [getAllData, setAllData] = useState({ main: [] })
  const [showTableItems, setTableItems] = useState([])

  // Drag-on ominaisuus
  const [getDraggingOn, setDraggingOn] = useState(false)

  // Valittu Notebook ja Folder
  const [showActiveListIndex, setActiveListIndex] = useState(localStorage.getItem("activeList"))
  const [showActiveFolderIndex, setActiveFolderIndex] = useState()

  function onNotebookEditClick(id: string) {
    setTableItems(getAllData.main.items)

    const li = document.getElementById(id)

    const dataNameDiv = li.getElementsByClassName('data-name-div')[0]
    dataNameDiv.innerHTML = ""

    const saveNotebookIcon = li.getElementsByClassName('save-notebook-icon')[0]
    saveNotebookIcon.style.display = "block"

    const notebookInput = li.getElementsByClassName('notebook-input')[0]
    notebookInput.style.display = "block"
  }

  function endEditing(data: any, index: any) {
    const li = document.getElementById(data.id)

    const notebookInput = li.getElementsByClassName('notebook-input')[0]
    notebookInput.style.display = "none"
    const newName = notebookInput.value

    const dataNameDiv = li.getElementsByClassName('data-name-div')[0]
    dataNameDiv.innerHTML = newName

    const saveNotebookIcon = li.getElementsByClassName('save-notebook-icon')[0]
    saveNotebookIcon.style.display = "none"

    const img = document.createElement('img')
    img.src = "data:image/png;base64," + "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAwXpUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHjabVBRDsMgCP3nFDsCClo4jl27ZDfY8YdCm7qOxAe8Z54I7J/3Cx49cmLgskjVWtGClTU3KwQ92sCEPNCbQ0szD6eQjSLL5K3UuH/w6TTw1KwqFyN5hrDOgnL4y49R9kR9ol5vYaRhRNmFFAbNv4VVZbl+Yd1xDvEDHVjmsW/9Ytvbir1DOe+UCA2JxAegfhioWaGGXbaBqQwGB1PDzBbyb09HwBftgVkZ6mxe2QAAAYRpQ0NQSUNDIHByb2ZpbGUAAHicfZE9SMNAHMVfU6VaKw52KOKQoTq1i4o4lioWwUJpK7TqYHLpFzRpSFJcHAXXgoMfi1UHF2ddHVwFQfADxNnBSdFFSvxfWmgR48FxP97de9y9A4RmlalmXwxQNctIJ+JiLr8q+l4xCD+GEEJEYqaezCxm4Tq+7uHh612UZ7mf+3MMKwWTAR6ROMZ0wyLeIJ7dtHTO+8RBVpYU4nPiiEEXJH7kutzmN84lhwWeGTSy6XniILFY6mG5h1nZUIlniMOKqlG+kGuzwnmLs1qts849+QsDBW0lw3Wa40hgCUmkIEJGHRVUYSFKq0aKiTTtx138Y44/RS6ZXBUwciygBhWS4wf/g9/dmsXpqXZSIA70v9j2xwTg2wVaDdv+Prbt1gngfQautK6/1gTmPklvdLXwETCyDVxcdzV5D7jcAUJPumRIjuSlKRSLwPsZfVMeGL0F/Gvt3jr7OH0AstTV8g1wcAhMlih73eXdA729/Xum098PsnZywMVFk18AAA12aVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA0LjQuMC1FeGl2MiI+CiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICB4bWxuczpHSU1QPSJodHRwOi8vd3d3LmdpbXAub3JnL3htcC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjZiZDAxOWE1LTYzOTktNDNjNy04NDUyLWNkMzc5ZjIyYTA4NCIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDplY2QxMGI2OC04ZjlkLTQ1MzItYTQyZC1hYzdlN2MwOWU3YjQiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpiNDRiNTI5OC0yYmYyLTQwOTktYjczNS04MDZhMGUzZmQ0MzIiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBHSU1QOkFQST0iMi4wIgogICBHSU1QOlBsYXRmb3JtPSJXaW5kb3dzIgogICBHSU1QOlRpbWVTdGFtcD0iMTcyNTk2OTYxNzE5NTQ5NCIKICAgR0lNUDpWZXJzaW9uPSIyLjEwLjM4IgogICB0aWZmOk9yaWVudGF0aW9uPSIxIgogICB4bXA6Q3JlYXRvclRvb2w9IkdJTVAgMi4xMCIKICAgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyNDowOToxMFQxNTowMDoxNiswMzowMCIKICAgeG1wOk1vZGlmeURhdGU9IjIwMjQ6MDk6MTBUMTU6MDA6MTYrMDM6MDAiPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDoyZWM5ZDIzMC0wZDc4LTQ3MjMtYmU5NC0wNThkNDM3ZmYxMzUiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjQtMDktMTBUMTU6MDA6MTciLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogIDwvcmRmOkRlc2NyaXB0aW9uPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+x1O8mAAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+gJCgwAETfEaMwAAAD6SURBVEjH3ZU9SgRBEIW/qtFZWtwBf9hgEfYQ3sMbeACP4A0MPIaZuZkXEROThQVhREVl1H4Gm8g6o4xMBVphddNf13uvafjrZW3N6fFZiVR1rXeUgPv5yWHzubm2umsXRqoXB1btnOKF9wBk4Ai4+BbA1niW59f7RRrvMUp9AO/Axmqz7QCnTE+YDeJBC8CM5nlzKWkIQKJMD/387QUA3poUOAHgxetQ76AdIHmsRMqOIiUyJzCmyyDFmmyWIz0QZopMkYFZpAdCWSgHTuCuOA8k4cVgEn39D+4eb3wyu2K9rDtT1v0fND8CbuFlWm2fI13+4sI1/64+AMujQQogWawfAAAAAElFTkSuQmCC"
    dataNameDiv.prepend(img)

    let allData = structuredClone(getAllData)

    for (let i = 0; i < allData.main.length; ++i) {
      if (data.id === allData.main[i].id) {

        allData.main[i].name = newName

        const options = {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(allData)
        }
        sendPutRequest(options)

        setAllData(allData)

        return // Poistutaan loopista
      }
    }
  }

  function onFolderEditClick(id: string) {
    const li = document.getElementById(id)

    const folderTitle = li.getElementsByClassName('folder-title')[0]
    folderTitle.style.display = "none"

    const folderInput = li.getElementsByClassName('folder-input')[0]
    folderInput.style.display = "block"

    const saveFolderIcon = li.getElementsByClassName('save-folder-icon')[0]
    saveFolderIcon.style.display = "block"

    const innerText = folderTitle.innerText
    folderInput.value = innerText
  }

  function onFolderSave(id: string) {
    const li = document.getElementById(id)

    const saveFolderIcon = li.getElementsByClassName('save-folder-icon')[0]
    saveFolderIcon.style.display = "none"

    const folderInput = li.getElementsByClassName('folder-input')[0]
    folderInput.style.display = "none"

    const newName = folderInput.value

    const folderTitle = li.getElementsByClassName('folder-title')[0]
    folderTitle.style.display = "block"
    folderTitle.innerText = newName

    const img = document.createElement('img')
    img.src = "data:image/png;base64," + "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"
    img.classList.add('folder-icon')
    folderTitle.prepend(img)

    let allData = structuredClone(getAllData)

    for (let i = 0; i < allData.main.length; ++i) {
      for (let u = 0; u < allData.main[i].items.length; ++u) {
        if (id == allData.main[i].items[u].id) {

          allData.main[i].items[u].name = newName

          const options = {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(allData)
          }
          sendPutRequest(options)

          setAllData(allData)

          return // Poistutaan loopista
        }
      }
    }
  }

  function onMouseClick(index: any) {
    localStorage.setItem("activeList", index.toString())
    setActiveListIndex(index)

    const allData = structuredClone(getAllData)

    setTableItems([])
    setActiveFolderIndex(undefined)

    setAllData(allData)
  }

  function onRemoveClick(id: any) {
    if (confirm('Are you sure you want to delete this notebook?')) {

      // Poistetaan Notebookin osat käyttöliittymästä
      const items = document.getElementsByClassName("table-item")
      for (let i = 0; i < items.length; ++i) {
        document.getElementsByClassName("table-item")[i].remove()
      }

      let allData = structuredClone(getAllData)

      for (let i = 0; i < allData.main.length; ++i) {
        if (id == allData.main[i].id) {
          const deleted_notebook = structuredClone(allData.main[i])

          delete allData.main[i]

          allData.main = allData.main.flat(0)

          const options = {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(deleted_notebook)
          }
          sendDeleteRequest(options)

          setAllData(allData)

          return // Poistutaan loopista
        }
      }
    }
  }

  function onAddClick(id: any) {
    let allData = structuredClone(getAllData)

    allData.main.forEach(notebook => {
      if (id == notebook.id) {
        const result = window.prompt("Folder name", "");

        if (result === null || result.trim().length === 0) {
          return alert("Name cannot be empty")
        }

        const newItem = {
          "name": result,
          "id": uuidv4(),
          "items": []
        }

        if (notebook.items) {
          notebook.items.push(newItem)
        } else {
          notebook.items = [newItem]
        }
      }
    })
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(allData)
    }
    sendPutRequest(options)

    setAllData(allData)
  }

  function onClickTrashIcon(notebookId: string, id: string) {
    if (confirm('Are you sure you want to delete this folder?')) {
      // Häivytetään elementti
      document.getElementById(id).style.display = "none"

      let allData = structuredClone(getAllData)

      for (let i = 0; i < allData.main.length; ++i) {
        if (notebookId == allData.main[i].id) {
          for (let u = 0; u < allData.main[i].items.length; ++u) {
            if (id == allData.main[i].items[u].id) {
              delete allData.main[i].items[u]
              allData.main[i].items = allData.main[i].items.flat(0)

              const options = {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(allData)
              }
              sendPutRequest(options)

              setTableItems(allData.main[showActiveListIndex].items[i])
              setAllData(allData)

              const tableList = document.getElementsByClassName('table-list')[0]
              tableList.replaceChildren()

              return // Poistutaan loopista
            }
          }
        }
      }
    }
  }

  useEffect(() => {
    const spinner = document.getElementById('spinner')

    if (spinner) {
      spinner.style.display = "block"
    }

    let cookie = getCookie("testudoAuthorization")

    fetch(`${DataURL}/${cookie}`)
      .then(res => res.json())
      .then(mainData => {
        if (mainData["Status"] === "Failure. Missing token!") {
          // Varoitetaan tokenin puuttumisesta
          alert("You are missing token!")
          setAllData({ "main": [] })
        } else {
          // Asetetaan koko data
          setAllData(mainData)
        }
      }).finally(() => {
        if (spinner) {
          spinner.style.display = "none"
        }
      })
  }, [])

  return (
    <div className="App">
      <Switch>
      <Route path="/">
        <Header />
        <AllContainer />
      </Route>
        <Route path="/Home">
          <Header />
          <Panel>
            <ListGroup
              setAllData={setAllData}
              getAllData={getAllData}
              onMouseClick={onMouseClick}
              setTableItems={setTableItems}
              setDraggingOn={setDraggingOn}
              getDraggingOn={getDraggingOn}>
              {
                getAllData.main.map(function (data: any, index: any) {
                  if (data && data.items && data.visible) {
                    if (index == showActiveListIndex) {
                      return (
                        <li id={data.id} key={data.id} className="list-group-item active-item">
                          <div className="notebook-icon">
                            <div className='data-name-div'>
                              <img src={notebook} alt="Notebook-icon" />
                              {data.name}
                            </div>
                            <input className='notebook-input' defaultValue={data.name} />
                          </div>
                          <img src={save}
                            className='save-notebook-icon'
                            onClick={() => endEditing(data, index)} />
                          <div className="data-items-listed">
                            {
                              // Listataan yksittäiset osat
                              data.items.map(function (d: any, i: any) {
                                if (i == showActiveFolderIndex) {
                                  return (
                                    <div key={d.id} onClick={() => {
                                      localStorage.setItem("activeFolder", i.toString())
                                      setActiveFolderIndex(i)
                                      onMouseClickTable(d, i)
                                      setTableItems(d)
                                    }}
                                      className='item'
                                      id={d.id}>
                                      <div className='folder-title'>
                                        <img className='folder-icon' src={folder} />
                                        {d.name}
                                      </div>

                                      <input className='folder-input' />

                                      <img className='trash-icon' src={trash}
                                        onClick={() => onClickTrashIcon(data.id, d.id)} />
                                      <img className='edit-folder-icon' src={edit}
                                        onClick={() => onFolderEditClick(d.id)} />
                                      <img className='save-folder-icon' src={save}
                                        onClick={() => onFolderSave(d.id)} />
                                    </div>
                                  )
                                }
                                return (
                                  <div key={d.id} onClick={() => {
                                    localStorage.setItem("activeFolder", i.toString())
                                    setActiveFolderIndex(i)
                                    onMouseClickTable(d, i)
                                    setTableItems(d)
                                  }}
                                    className='item'
                                    id={d.id}>
                                    <div className='folder-title'>
                                      <img className='folder-icon' src={folder} />
                                      {d.name}
                                    </div>

                                    <input className='folder-input' />

                                    <img className='trash-icon' src={trash}
                                      onClick={() => onClickTrashIcon(data.id, d.id)} />
                                    <img className='edit-folder-icon' src={edit}
                                      onClick={() => onFolderEditClick(d.id)} />
                                    <img className='save-folder-icon' src={save}
                                      onClick={() => onFolderSave(d.id)} />
                                  </div>
                                )
                              })
                            }
                          </div>
                          <div className='buttons'>
                            <img className='pencil-button'
                              src={pencil}
                              onClick={() => onNotebookEditClick(data.id)} />
                            <img className='plus-sign'
                              src={plus}
                              onClick={() => onAddClick(data.id)} />
                            <img className='remove-button'
                              src={remove}
                              onClick={() => onRemoveClick(data.id)} />
                          </div>
                        </li>
                      )
                    }
                    else {
                      return (
                        <li id={data.id} key={data.id}
                          onClick={() => onMouseClick(index)} className="list-group-item">
                          <div className="notebook-icon">
                            <div className='data-name-div'>
                              <img src={notebook} alt="Notebook-icon" />
                              {data.name}
                            </div>
                            <input className='notebook-input' defaultValue={data.name} />
                            <img src={save}
                              className='save-notebook-icon'
                              onClick={() => endEditing(data, index)} />
                          </div>
                        </li>
                      )
                    }
                  } else {
                    return <div></div>
                  }
                })
              }
            </ListGroup>
          </Panel>
          <InnerContainer data={showTableItems}
            setActiveFolderIndex={setActiveFolderIndex}
            showActiveListIndex={showActiveListIndex}
            showActiveFolderIndex={showActiveFolderIndex}
            getAllData={getAllData}
            setTableItems={setTableItems}
            setAllData={setAllData}
            getDraggingOn={getDraggingOn}
            setDraggingOn={setDraggingOn} />
        </Route>
        <Route path="/notebooks">
          <Header />
          <NotebookContainer setAllData={setAllData}/>
        </Route>
      </Switch>
    </div>
  )
}

export default App;

