import { useEffect, useState } from 'react'
import NotebookList from './subcomponents/NotebookList'
import spinner from '../../../public/spinner.png'
import { BaseURL, getCookie } from '../../methods/AppMethods'
import './style.css'



const NotebookContainer = (props: any) => {
    const [getNotebooks, setNotebooks] = useState({ main: [] })

    useEffect(() => {
        const notebookSpinner = document.getElementById('notebook-spinner')
        notebookSpinner.style.display = "block"

        let cookie = getCookie("testudoAuthorization")

        fetch(`${BaseURL}/notebooks/${cookie}`)
            .then(res => res.json())
            .then(mainData => {
                if (mainData.Status === "Failure. Missing token!") {
                    // Varoitetaan tokenin puuttumisesta
                    alert("You are missing token!")
                    setNotebooks({ "main": [] })
                } else {
                    // Asetetaan koko data
                    setNotebooks(mainData)
                }
                notebookSpinner.style.display = "none"
            }).finally(() => {
                const saveNotebooksBtn = document.getElementById('save-notebooks-btn')
                saveNotebooksBtn.style.display = "block"
            })
    }, [])

    return <div id="notebook-container">
        <NotebookList
            getNotebooks={getNotebooks}
            setNotebooks={setNotebooks} />
        <img id="notebook-spinner" src={spinner} />
    </div>
}




export default NotebookContainer

