import React from 'react'
import NotebookList from './subcomponents/NotebookList'
import spinner from '../../../public/spinner.png'
import './style.css'
import { BaseURL, getCookie } from '../../methods/AppMethods'


class NotebookContainer extends React.Component {
    constructor(props: any) {
        super(props)
        this.state = {
            notebooks: { main: [] }
        }
    }

    componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any): void {
    }

    componentDidMount(): void {
        let cookie = getCookie("testudoAuthorization")

        fetch(`${BaseURL}/notebooks/${cookie}`)
            .then(res => res.json())
            .then(mainData => {
                if (mainData.Status === "Failure. Missing token!") {
                    // Varoitetaan tokenin puuttumisesta
                    alert("You are missing token!")
                    this.setState({notebooks: { "main": [] }})
                } else {
                    // Asetetaan koko data
                    this.setState({notebooks: mainData})
                }
            })
    }

    render() {
        return <div id="notebook-container">
            <NotebookList getNotebooks={this.state.notebooks} />
            <img id="spinner" src={spinner} />
        </div>
    }
}




export default NotebookContainer

