import reload from '../../../public/reload.png'
import bottom from '../../../public/bottom.png'
import add_notebook from '../../../public/add_notebook.png'
import notebook from '../public/notebook.png'
import { uuidv4, sendPutRequest } from '../../methods/AppMethods'
import './style.css'


const ListGroup = (props: any) => {
  const defaultSize = "227"

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
    const allData = JSON.parse(localStorage.getItem('main-data'))
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

    //localStorage.setItem("main-data", JSON.stringify(allData))
    props.setAllData(allData)

    // Valitaan luotu Notebook
    props.onMouseClick("0")
  }

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
      </div>
      <ul id="list-group" className="list-group">
        {props.children}
      </ul>
    </div>
  )
}


export default ListGroup

