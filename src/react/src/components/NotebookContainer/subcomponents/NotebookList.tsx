import React from 'react'
import './style.css'


class NotebookList extends React.Component {
    constructor(props: any) {
        super(props)
        this.state = {}
    }

    onCheckboxClick = (e: any, data: any) => {
        const notebooks: any = {...this.props.getNotebooks}
        
        for (let i = 0; i < notebooks.main.length; ++i) {

            if (notebooks.main[i].id == data.id) {

                const visible = notebooks.main[i]['visible']

                console.log(visible)
                
                if (visible) {
                    notebooks.main[i]['visible'] = false
                } else {
                    notebooks.main[i]['visible'] = true
                }

                this.props.setNotebooks(notebooks)

                

                return // Lopetetaan looppaaminen
            }
        }
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
                                return <li className='list-group-item notebook-list-item item-active' key={data.id}
                                    onClick={(e) => this.onCheckboxClick(e, data)}>
                                    <p>{data.name}</p>
                                    <label className="checkbox-container">
                                        <input type="checkbox" checked={true} onClick={(e) => this.onCheckboxClick(e, data)} />
                                        <span className="checkmark"></span>
                                    </label>
                                </li>
                            } else {
                                return <li className='list-group-item notebook-list-item' key={data.id}
                                    onClick={(e) => this.onCheckboxClick(e, data)}>
                                    <p>{data.name}</p>
                                    <label className="checkbox-container">
                                        <input type="checkbox" checked={false} onClick={(e) => this.onCheckboxClick(e, data)} />
                                        <span className="checkmark"></span>
                                    </label>
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

