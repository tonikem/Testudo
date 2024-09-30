import React from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { twilight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import copy from '../../../public/copy.png'
import edit from '../../../public/edit.png'
import notePlus from '../../../public/note-plus.png'
import open from '../../../public/open.png'
import save from '../../../public/save.png'
import trash from '../../../public/trash.png'
import spinner from '../../../public/spinner.png'
import './style.css'
import { BaseURL, DataURL, sendPutRequest, uuidv4, getCookie } from '../../methods/AppMethods'


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
        if (this.props.data && this.props.data.content) {
            return (
                <div id="inner-container" style={{ marginLeft: localStorage.getItem("panelWidth") }}>
                    <ul className='table-list'>
                        {
                            this.props.data.content.map((d: any, index: number) => {
                                switch (d.type) {
                                    case 'URL':
                                        this.urlExists(d.payload, (color: string) => {
                                            const container = document.getElementById(d.id)
                                            if (container) {
                                                const statusBar = container.getElementsByClassName('status-bar')[0]
                                                const status = statusBar.getElementsByTagName('div')[0]
                                                status.style.backgroundColor = color
                                            }
                                        })
                                        if (this.arrowBooleans[d.id] === undefined || this.arrowBooleans[d.id] === null) {
                                            this.arrowBooleans[d.id] = false
                                        }
                                        return (
                                            <li id={d.id} key={d.id}
                                                className="table-item"
                                                draggable
                                                onDragStart={() => this.onDragStart(index)}
                                                onDragEnter={() => this.onDragEnter(index)}
                                                onDragEnd={() => this.handleSort(index)}
                                                onDragOver={(e) => e.preventDefault()}>

                                                {/* Tällä vaihdetaan muistiinpanon tyyppi */}
                                                <select defaultValue={d.type}
                                                    className='selector'
                                                    onChange={e => this.setSelectedValue(e.target.value, d.id)}>
                                                    <option value="Text">Text</option>
                                                    <option value="URL">URL</option>
                                                    <option value="Code">Code</option>
                                                    <option value="Audio">Audio</option>
                                                </select>

                                                <div className='buttons'>
                                                    <i onClick={() => {
                                                        // Asetetaan boolean arvo nuolelle
                                                        this.resize(d.id)
                                                    }} className="arrow"></i>

                                                    <div className='data-type'>
                                                        {d.type}
                                                    </div>
                                                    <img className="copy-icon"
                                                        src={copy}
                                                        onClick={() => { this.onClipBoardClick(d.id) }} />
                                                    <img className='edit-icon'
                                                        src={edit}
                                                        onClick={() => this.onEditClick(d)} />
                                                    <img className='delete-icon'
                                                        src={trash}
                                                        onClick={() => this.onDeleteClick(d, '')} />
                                                </div>

                                                <div className='edit-input'>
                                                    <input className='title-input'
                                                        type="text"
                                                        defaultValue={d.name} />

                                                    <input className='payload-input'
                                                        type='url'
                                                        defaultValue={d.payload} />
                                                </div>

                                                <p className='item-name'>
                                                    {d.name}
                                                </p>
                                                <p className='item-payload'>
                                                    {d.payload}
                                                </p>
                                                <div className='hidden-element'>
                                                    <iframe className='url-source' src={d.payload}></iframe>
                                                    <div className='status-bar'>
                                                        <div>{/* Tämä on tyhjä. Tänne status väri. */}</div>
                                                        <p>Status: </p>
                                                    </div>
                                                </div>
                                                <img className='save-icon'
                                                    src={save}
                                                    onClick={() => this.endEditing(d)} />
                                            </li>
                                        )
                                    case 'Code':
                                        if (this.arrowBooleans[d.id] === undefined || this.arrowBooleans[d.id] === null) {
                                            this.arrowBooleans[d.id] = false
                                        }
                                        return (
                                            <li id={d.id} key={d.id}
                                                className="table-item"
                                                draggable
                                                onDragStart={() => this.onDragStart(index)}
                                                onDragEnter={() => this.onDragEnter(index)}
                                                onDragEnd={() => this.handleSort(index)}
                                                onDragOver={(e) => e.preventDefault()}>

                                                {/* Tällä vaihdetaan muistiinpanon tyyppi */}
                                                <select defaultValue={d.type}
                                                    className='selector'
                                                    onChange={e => this.setSelectedValue(e.target.value, d.id)}>
                                                    <option value="Text">Text</option>
                                                    <option value="URL">URL</option>
                                                    <option value="Code">Code</option>
                                                    <option value="Audio">Audio</option>
                                                </select>

                                                <div className='buttons'>
                                                    <i onClick={() => {
                                                        // Asetetaan boolean arvo nuolelle
                                                        this.resize(d.id)
                                                    }} className="arrow"></i>

                                                    <div className='data-type'>
                                                        {d.type}
                                                    </div>
                                                    <img className="copy-icon"
                                                        src={copy}
                                                        onClick={() => { this.onClipBoardClick(d.id) }} />
                                                    <img className='edit-icon'
                                                        src={edit}
                                                        onClick={() => this.onEditClick(d)} />
                                                    <img className='delete-icon'
                                                        src={trash}
                                                        onClick={() => this.onDeleteClick(d, '')} />
                                                </div>

                                                <div className='edit-input'>
                                                    <input className='title-input'
                                                        type="text"
                                                        defaultValue={d.name} />

                                                    <input className='payload-input'
                                                        defaultValue={d.payload} />

                                                    <input className='code-style'
                                                        placeholder='Language name'
                                                        type='code'
                                                        defaultValue={d.codeStyle} />
                                                </div>

                                                <p className='item-name'>
                                                    {d.name}
                                                </p>
                                                <p className='code-name'>
                                                    Programming language: {d.codeStyle}
                                                </p>
                                                <div className='hidden-element'>
                                                    <div className='item-payload'>
                                                        <SyntaxHighlighter language={d.codeStyle} style={twilight} showLineNumbers>
                                                            {d.payload}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                </div>
                                                <img className='save-icon'
                                                    src={save}
                                                    onClick={() => this.endEditing(d)} />
                                            </li>
                                        )
                                    case 'Audio':
                                        if (this.arrowBooleans[d.id] === undefined || this.arrowBooleans[d.id] === null) {
                                            this.arrowBooleans[d.id] = false
                                        }
                                        const set_cookie = getCookie("testudoAuthorization")

                                        audioFiles[d.id] = d.payload
                                        return (
                                            <li id={d.id} key={d.id}
                                                className="table-item"
                                                draggable
                                                onDragStart={() => this.onDragStart(index)}
                                                onDragEnter={() => this.onDragEnter(index)}
                                                onDragEnd={() => this.handleSort(index)}
                                                onDragOver={(e) => e.preventDefault()}>

                                                {/* Tällä vaihdetaan muistiinpanon tyyppi */}
                                                <select defaultValue={d.type}
                                                    className='selector'
                                                    onChange={e => this.setSelectedValue(e.target.value, d.id)}>
                                                    <option value="Text">Text</option>
                                                    <option value="URL">URL</option>
                                                    <option value="Code">Code</option>
                                                    <option value="Audio">Audio</option>
                                                </select>

                                                <div className='buttons'>
                                                    <i onClick={() => {
                                                        // Asetetaan boolean arvo nuolelle
                                                        this.resize(d.id)
                                                    }} className="arrow"></i>

                                                    <div className='data-type'>
                                                        {d.type}
                                                    </div>
                                                    <img className="copy-icon"
                                                        src={copy}
                                                        onClick={() => { this.onClipBoardClick(d.id) }} />
                                                    <img className='edit-icon'
                                                        src={edit}
                                                        onClick={() => this.onEditClick(d)} />
                                                    <img className='delete-icon'
                                                        src={trash}
                                                        onClick={() => this.onDeleteClick(d, 'audio')} />
                                                </div>

                                                <div className='edit-input'>
                                                    <input className='title-input'
                                                        type="text"
                                                        defaultValue={d.name} />

                                                    <input className='payload-input'
                                                        style={{ display: 'none' }}
                                                        type="file"
                                                        onChange={(e) => this.onChangeFile(e, d.id)} />
                                                </div>

                                                <p className='item-name'>
                                                    {d.name}
                                                </p>
                                                <div className='hidden-element'>
                                                    <audio className='audio' controls="controls" autobuffer="autobuffer">
                                                        <source src={`${BaseURL}/files/${set_cookie}/${d.payload}`} />
                                                    </audio>
                                                    <div className='text-field'></div>
                                                </div>
                                                <img className='save-icon'
                                                    src={save}
                                                    onClick={() => this.endEditing(d)} />
                                            </li>
                                        )
                                    default:
                                        if (this.arrowBooleans[d.id] === undefined || this.arrowBooleans[d.id] === null) {
                                            this.arrowBooleans[d.id] = false
                                        }
                                        return (
                                            <li id={d.id} key={d.id}
                                                className="table-item"
                                                draggable
                                                onDragStart={() => this.onDragStart(index)}
                                                onDragEnter={() => this.onDragEnter(index)}
                                                onDragEnd={() => this.handleSort(index)}
                                                onDragOver={(e) => e.preventDefault()}>

                                                {/* Tällä vaihdetaan muistiinpanon tyyppi */}
                                                <select defaultValue={d.type}
                                                    className='selector'
                                                    onChange={e => this.setSelectedValue(e.target.value, d.id)}>
                                                    <option value="Text">Text</option>
                                                    <option value="URL">URL</option>
                                                    <option value="Code">Code</option>
                                                    <option value="Audio">Audio</option>
                                                </select>

                                                <div className='buttons'>
                                                    <i onClick={() => {
                                                        // Asetetaan boolean arvo nuolelle
                                                        this.resize(d.id)
                                                    }} className="arrow"></i>

                                                    <div className='data-type'>
                                                        {d.type}
                                                    </div>
                                                    <img className="copy-icon"
                                                        src={copy}
                                                        onClick={() => { this.onClipBoardClick(d.id) }} />
                                                    <img className='edit-icon'
                                                        src={edit}
                                                        onClick={() => this.onEditClick(d)} />
                                                    <img className='delete-icon'
                                                        src={trash}
                                                        onClick={() => this.onDeleteClick(d, '')} />
                                                </div>

                                                <div className='edit-input'>
                                                    <input className='title-input'
                                                        type="text"
                                                        defaultValue={d.name} />

                                                    <input className='payload-input'
                                                        defaultValue={d.payload} />
                                                </div>

                                                <p className='item-name'>
                                                    {d.name}
                                                </p>
                                                <p className='item-payload'>
                                                    {d.payload}
                                                </p>
                                                <div className='hidden-element'>
                                                    <div className='text-field'></div>
                                                </div>
                                                <img className='save-icon'
                                                    src={save}
                                                    onClick={() => this.endEditing(d)} />
                                            </li>
                                        )
                                }
                            })
                        }
                    </ul>
                    <img className='note-plus'
                        src={notePlus}
                        onClick={() => this.onPlusNoteClick(this.props.data)} />
                    <img className='open-icon'
                        src={open}
                        onClick={() => this.onOpenClick()} />
                </div>
            )
        } else {
            if (this.props.data && this.props.showActiveFolderIndex) {
                return (
                    <div id="inner-container" style={this.initialStyle}>
                        <img id="spinner" src={spinner} />

                        <ul className='table-list'></ul>
                        <img className='note-plus'
                            src={notePlus}
                            onClick={() => this.onPlusNoteClick(this.props.data)} />
                        <img className='open-icon'
                            src={open}
                            onClick={() => this.onOpenClick()} />
                    </div>
                )
            } else {
                return <div id="inner-container" style={this.initialStyle}>
                    <img id="spinner" src={spinner} />
                </div>
            }
        }
    }
}


export default NotebookContainer

