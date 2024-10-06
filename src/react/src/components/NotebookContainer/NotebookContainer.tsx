import { useEffect, useState } from 'react'
import NotebookList from './subcomponents/NotebookList'
import spinner from '../../../public/spinner.png'
import { BaseURL, getCookie } from '../../methods/AppMethods'
import './style.css'



const NotebookContainer = (props: any) => {

    useEffect(() => {
    }, [])

    return <div id="notebook-container">
        <NotebookList
            updateAllData={props.updateAllData}
            setAllData={props.setAllData}
            getNotebooks={props.getNotebooks}
            setNotebooks={props.setNotebooks} />
        <img id="notebook-spinner" src={spinner} />
    </div>
}




export default NotebookContainer

