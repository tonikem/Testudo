import React from 'react'
import './style.css'


class NotebookList extends React.Component {
    render() {
        return (
            <div className='list-container'>
                <h1 className='list-header'>
                    Choose the Notebook visibility
                </h1>
                <ul className='list-group notebook-list'>
                    {
                        this.props.getNotebooks.main.map(function (data: any, index: any) {
                            if (data.visible) {
                                return <li className='list-group-item notebook-list-item item-active' key={data.id}>
                                    <p>{data.name}</p>
                                    <label className="checkbox-container">
                                        <input type="checkbox" checked={true} />
                                        <span className="checkmark"></span>
                                    </label>
                                </li>
                            } else {
                                return <li className='list-group-item notebook-list-item' key={data.id}>
                                    <p>{data.name}</p>
                                </li>
                            }
                        })
                    }
                </ul>
            </div>
        )
    }
}


export default NotebookList

