import add_notebook from '../../../../public/add_notebook.png'
import { BaseURL, getCookie, sendPutRequest, uuidv4 } from '../../../methods/AppMethods'
import React from 'react'
import './style.css'



class NotebookList extends React.Component {
    constructor(props: any) {
        super(props)
        this.state = {}
    }

    onCheckboxClick = (e: any, data: any) => {
        const notebooks: any = { ...this.props.getNotebooks }

        for (let i = 0; i < notebooks.main.length; ++i) {

            if (notebooks.main[i].id == data.id) {
                const visible = e.target.checked

                this.props.setNotebooks(notebooks)

                const cookie = getCookie("testudoAuthorization")

                const options = {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(notebooks)
                }

                fetch(`${BaseURL}/notebooks/${cookie}`, options)
                    .then(res => res.json())
                    .then(response => {
                        console.log(response)
                    })

                return // Lopetetaan looppaaminen
            }
        }
    }

    onSaveClick = (event: any) => {
        location.reload()
    }

    onMouseClickAddNotebook = () => {
        const allData = structuredClone(this.props.getNotebooks)
        const name = window.prompt("Notebook name", "")
    
        if (name === null || name.trim().length === 0) {
          return alert("Name cannot be empty")
        }
    
        const newNotebook = {
          "id": uuidv4(),
          "items": [],
          "name": name,
          'visible': true
        }
    
        allData.main.unshift(newNotebook)
    
        const options = {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(allData)
        }

        console.log(allData)

        sendPutRequest(options)
        //this.props.setAllData(allData)
        this.props.setNotebooks(allData)
    }

    render() {
        return (
            <div className='list-container'>
                <h1 className='list-header'>
                    Choose the Notebook visibility
                </h1>
                <ul className='list-group notebook-list'>
                    {
                        this.props.getNotebooks.main.map((data: any, index: any) => {
                            if (data.visible) {
                                return <li className='list-group-item notebook-list-item item-active' key={data.id}>
                                    <p>{data.name}</p>
                                    <label className="checkbox-container">
                                        <input type="checkbox" defaultChecked={true} onClick={(e) => this.onCheckboxClick(e, data)} />
                                        <span className="checkmark"></span>
                                    </label>
                                </li>
                            } else {
                                return <li className='list-group-item notebook-list-item' key={data.id}>
                                    <p>{data.name}</p>
                                    <label className="checkbox-container">
                                        <input type="checkbox" defaultChecked={false} onClick={(e) => this.onCheckboxClick(e, data)} />
                                        <span className="checkmark"></span>
                                    </label>
                                </li>
                            }
                        })
                    }
                </ul>
                <img id="add-notebook-to-list"
                    src={add_notebook}
                    onClick={this.onMouseClickAddNotebook} />
                <button id="save-notebooks-btn" type="button" className="btn btn-success" onClick={this.onSaveClick}>
                    Save
                </button>
            </div>
        )
    }
}


export default NotebookList

