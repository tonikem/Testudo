import React from 'react'
import spinner from '../../../public/spinner.png'
import './style.css'


class NotebookContainer extends React.Component {
    constructor(props: any) {
        super(props)
        this.state = {
            dragNote: 0,
            dragOverNote: 0,
            file: {}
        }
    }

    componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any): void {
    }

    render() {
        return <div className="inner-container">
            <img id="spinner" src={spinner} />
        </div>
    }
}




export default NotebookContainer

