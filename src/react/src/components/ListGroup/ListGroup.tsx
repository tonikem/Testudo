import reload from '../../../public/reload.png'
import bottom from '../../../public/bottom.png'
import add_notebook from '../../../public/add_notebook.png'
import { uuidv4, sendPutRequest } from '../../methods/AppMethods'
import { useEffect } from 'react'
import './style.css'


const ListGroup = (props: any) => {
  const defaultSize = "255"

  function onMouseClickReload() {
    document.getElementById("reload-icon").style["animation-name"] = "spin"

    document.getElementById('inner-container').style.marginLeft = defaultSize + "px"
    document.getElementById('panel').style.width = defaultSize + "px"
    localStorage.setItem("panelWidth", defaultSize)

    setTimeout(() => {
      document.getElementById("reload-icon").style["animation-name"] = ""
      location.reload()
    }, 1001);
  }

  function onMouseClickBottom() {
    const body = document.getElementsByTagName("body")[0]

    window.scroll({
      top: body.offsetHeight + 77,
      behavior: "smooth",
    })
  }

  function onMouseClickAddNotebook() {
    const allData = structuredClone(props.getAllData)
    const name = window.prompt("Notebook name", "")

    if (name === null || name.trim().length === 0) {
      return alert("Name cannot be empty")
    }

    const newNotebook = {
      "id": uuidv4(),
      "items": [],
      "name": name
    }

    allData.main.unshift(newNotebook)

    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(allData)
    }
    sendPutRequest(options)

    props.setAllData(allData)
  }

  useEffect(() => {
    document.getElementById('drag-on-checkbox').checked = true
  }, [])

  return (
    <div className="list">
      <div className='list-header'>
        <img id="bottom-icon"
          src={bottom}
          onClick={onMouseClickBottom} />
        <img id="reload-icon"
          src={reload}
          onClick={onMouseClickReload} />
        <img id="add-notebook"
          src={add_notebook}
          onClick={onMouseClickAddNotebook} />
        <label className="switch">
          <p className='drag-on-text'>Drag on:</p>
          <input id='drag-on-checkbox' type="checkbox"/>
          <span className="slider round"></span>
        </label>
      </div>
      <ul id="list-group" className="list-group">
        {props.children}
      </ul>
    </div>
  )
}


export default ListGroup

