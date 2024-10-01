import React from 'react'
import './style.css'


class NotebookList extends React.Component {
    render() {
        console.log(this.props.getAllData)
        return (
            <div className='list-container'>
                <ul className='notebook-list'>
                    {
                        this.props.getAllData.main.map(function (data: any, index: any) {
                            return <li key={data.id}>{data.name}</li>
                        })
                    }
                </ul>
            </div>
        )
    }
}


export default NotebookList

