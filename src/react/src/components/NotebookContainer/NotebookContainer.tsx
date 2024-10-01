import React from 'react'
import NotebookList from './subcomponents/NotebookList'
import spinner from '../../../public/spinner.png'
import './style.css'


class NotebookContainer extends React.Component {
    constructor(props: any) {
        super(props)
        this.state = {}
    }

    componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any): void {
    }

    componentDidMount(): void {
    }

    render() {
        return <div id="notebook-container">
            <NotebookList getAllData={this.props.getAllData}/>
            <img id="spinner" src={spinner} />
        </div>
    }
}




export default NotebookContainer

