import React, { useEffect, useState } from 'react'
import NotebookList from './subcomponents/NotebookList'
import spinner from '../../../public/spinner.png'
import './style.css'
import { BaseURL, getCookie } from '../../methods/AppMethods'


const NotebookContainer = () => {
    const [getNotebooks, setNotebooks] = useState({ main: [] })

    useEffect(() => {
        const notebookSpinner: any = document.getElementById('notebook-spinner')
        if (notebookSpinner) {
            notebookSpinner.style.display = "block"
        }

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
            }).finally(() => {
                if (notebookSpinner) {
                    notebookSpinner.style.display = "none"
                }
            })
    }, [])

    return <div id="notebook-container">
        <NotebookList getNotebooks={getNotebooks}
            setNotebooks={setNotebooks} />
        <img id="notebook-spinner" src={spinner} />
    </div>
}




export default NotebookContainer

