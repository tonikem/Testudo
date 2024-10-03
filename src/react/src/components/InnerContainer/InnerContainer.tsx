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


let audioFiles: any = {}


class InnerContainer extends React.Component {
    constructor(props: any) {
        super(props)
        this.state = {
            dragNote: 0,
            dragOverNote: 0,
            file: {}
        }
    }
    arrowBooleans: any = {}

    setNote(clone: any, id: any) {
        const allData = structuredClone(this.props.getAllData)
        const items = structuredClone(allData.main[this.props.showActiveListIndex].items)

        for (let i = 0; i < items.length; ++i) {
            if (items[i].id === id) {
                if (items[i].content) {
                    // Asetetaan uusi listajärjestys
                    allData.main[this.props.showActiveListIndex].items[i].content = clone

                    const options = {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(allData)
                    }
                    sendPutRequest(options)

                    this.props.setTableItems(allData.main[this.props.showActiveListIndex].items[i])
                    this.props.setAllData(allData)
                    this.forceUpdate()

                    return // Poistutaan loopista
                }
            }
        }
    }

    onDragStart(index: any) {
        this.setState({ dragNote: index })
    }

    onDragEnter(index: any) {
        this.setState({ dragOverNote: index })
    }

    handleSort(index: number) {
        const clone = [...this.props.data.content]
        const temp = clone[this.state.dragNote]

        clone[this.state.dragNote] = clone[this.state.dragOverNote]
        clone[this.state.dragOverNote] = temp

        this.setNote(clone, this.props.data.id)
    }

    urlExists(url: string, callback: any) {
        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "HEAD",
                mode: 'no-cors'
            }).then(res => {
                if (res.status == 404) {
                    return callback("orange")
                }
                callback("green")
            }).catch(error => {
                callback("red")
            })
        })
    }

    resize(id: string) {
        const isResized = this.arrowBooleans[id]
        const li = document.getElementById(id)

        if (isResized) {
            li.getElementsByClassName("hidden-element")[0].style.display = "none"
            li.style.height = "70px"
            li.getElementsByClassName("arrow")[0].style.transform = "rotate(-45deg)"
        } else {
            li.getElementsByClassName("hidden-element")[0].style.display = "flex"
            li.style.height = "auto"
            li.getElementsByClassName("arrow")[0].style.transform = "rotate(45deg)"
        }
        this.arrowBooleans[id] = !this.arrowBooleans[id]
    }

    onClipBoardClick(id: string) {
        const data = structuredClone(this.props.getAllData)
        const items = structuredClone(data.main[this.props.showActiveListIndex].items)

        for (let i = 0; i < items.length; ++i) {
            if (items[i].content) {
                for (let u = 0; u < items[i].content.length; ++u) {
                    if (items[i].content[u].id === id) {
                        // Kopioidaan "payload"
                        navigator.clipboard.writeText(items[i].content[u].payload)
                        alert("Copied the text: " + items[i].content[u].payload)
                    }
                }
            }
        }
    }

    onEditClick(data: any) {
        // Aloitetaan muistiinpanon muokkaus
        const li = document.getElementById(data.id)
        li.style.backgroundColor = "#2e436e"
        li.style.height = "auto"

        const buttons = li.getElementsByClassName('buttons')[0]
        buttons.style.display = "none"

        const itemName = li.getElementsByClassName('item-name')[0]
        itemName.style.display = "none"

        const itemPayload = li.getElementsByClassName('item-payload')[0]

        if (itemPayload) {
            itemPayload.style.display = "none"
        }

        const hiddenElement = li.getElementsByClassName('hidden-element')[0]

        if (hiddenElement) {
            hiddenElement.style.display = "none"
        }

        const saveButton = li.getElementsByClassName('save-icon')[0]
        saveButton.style.display = "block"

        const selector = li.getElementsByClassName('selector')[0]
        selector.style.display = "block"

        const titleInput = li.getElementsByClassName('title-input')[0]
        titleInput.style.display = "block"

        if (selector.value === "Code") {
            const codeStyle = li.getElementsByClassName('code-style')[0]
            if (codeStyle) {
                codeStyle.style.display = "block"
            }
        }

        const payloadInput = li.getElementsByClassName('payload-input')[0]
        payloadInput.style.display = "block"

        if (selector.value === "Text" || selector.value === "Code") {
            const textarea = document.createElement("textarea")
            textarea.classList.add("payload-input")
            textarea.style.display = "block"
            textarea.style.minHeight = "200px"
            textarea.value = data.payload
            payloadInput.replaceWith(textarea);
        }
    }

    endEditing(data: any) {
        // Tallennetaan muistiinpano
        const li = document.getElementById(data.id)
        const titleInput = li.getElementsByClassName('title-input')[0]
        const selector = li.getElementsByClassName('selector')[0]
        let payloadInput = li.getElementsByClassName('payload-input')[0]

        // Asetetaan uudet arvot
        data.name = titleInput.value
        data.type = selector.value

        if (payloadInput.type === "file") {
            data.payload = audioFiles[data.id]
        } else {
            data.payload = payloadInput.value
        }

        const codeStyle = li.getElementsByClassName('code-style')[0]

        if (codeStyle) {
            data.codeStyle = codeStyle.value.toLowerCase()
            if (codeStyle.value.toLowerCase() === "c++") {
                data.codeStyle = "cpp"
            }
            codeStyle.value = data.codeStyle
        }

        const hiddenElement = li.getElementsByClassName('hidden-element')[0]
        if (hiddenElement) {
            hiddenElement.style.display = "none"
        }

        const allData = structuredClone(this.props.getAllData)
        const items = structuredClone(allData.main[this.props.showActiveListIndex].items)

        for (let i = 0; i < items.length; ++i) {
            if (items[i].content) {
                for (let u = 0; u < items[i].content.length; ++u) {
                    if (items[i].content[u].id === data.id) {
                        // Korvataan vanha muistiinpano uudella datalla
                        allData.main[this.props.showActiveListIndex].items[i].content[u] = data

                        const options = {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(allData)
                        }
                        sendPutRequest(options)

                        // Asetetaan uudet listan jäsenet
                        this.props.setTableItems(allData.main[this.props.showActiveListIndex].items[i])
                        this.props.setAllData(allData)
                        this.forceUpdate()

                        // Sitten palautetaan elementti ennalleen ->
                        const saveButton = li.getElementsByClassName('save-icon')[0]
                        saveButton.style.display = "none"

                        const selector = li.getElementsByClassName('selector')[0]
                        selector.style.display = "none"

                        const titleInput = li.getElementsByClassName('title-input')[0]
                        titleInput.style.display = "none"

                        const payloadInput = li.getElementsByClassName('payload-input')[0]
                        payloadInput.style.display = "none"

                        if (codeStyle) {
                            codeStyle.style.display = "none"
                        }

                        li.style.backgroundColor = "#26282e"
                        li.style.height = "70px"

                        const buttons = li.getElementsByClassName('buttons')[0]
                        buttons.style.display = "block"

                        const itemName = li.getElementsByClassName('item-name')[0]
                        itemName.style.display = "block"

                        const itemPayload = li.getElementsByClassName('item-payload')[0]

                        if (itemPayload) {
                            itemPayload.style.display = "block"
                        }

                        setTimeout(() => {
                            li.getElementsByClassName("hidden-element")[0].style.display = "flex"
                            li.style.height = "auto"
                            li.getElementsByClassName("arrow")[0].style.transform = "rotate(45deg)"
                            this.arrowBooleans[data.id] = true
                        }, 40)

                        return // Lopetetaan looppaaminen
                    }
                }
            }
        }
    }

    onDeleteClick(data: any, way: string) {
        if (confirm('Are you sure you want to delete this note?')) {

            const allData = structuredClone(this.props.getAllData)
            const items = structuredClone(allData.main[this.props.showActiveListIndex].items)

            for (let i = 0; i < items.length; ++i) {
                if (items[i].content) {
                    for (let u = 0; u < items[i].content.length; ++u) {
                        if (items[i].content[u].id === data.id) {

                            const payload = structuredClone(allData.main[this.props.showActiveListIndex].items[i].content[u].payload)

                            delete allData.main[this.props.showActiveListIndex].items[i].content[u]
                            allData.main[this.props.showActiveListIndex].items[i].content = allData.main[this.props.showActiveListIndex].items[i].content.flat(0)

                            const options = {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(allData)
                            }
                            sendPutRequest(options)

                            if (way === 'audio') {
                                const options = {
                                    method: 'DELETE',
                                    headers: {}
                                }
                                let cookie = getCookie("testudoAuthorization")

                                fetch(`${BaseURL}/audio/${cookie}/${data.payload}`, options)
                                    .then(response => {
                                        if (!response.ok) {
                                            throw new Error('Network response was not ok')
                                        }
                                        return response.json()
                                    })
                                    .then(data => {
                                        console.log('Resource deleted successfully:', data)
                                    })
                                    .catch(error => {
                                        console.error('There was a problem with your fetch operation:', error)
                                    })
                            }
                            // Asetetaan uudet listan jäsenet
                            this.props.setTableItems(allData.main[this.props.showActiveListIndex].items[i])
                            this.props.setAllData(allData)

                            return // Poistutaan loopista
                        }
                    }
                }
            }
        }
    }

    onChangeAudioFile(event: any, id: string) {
        const input = event.target

        const reader = new FileReader()

        reader.onload = function () {
            const binary: any = reader.result

            const name = input.value.split('\\').pop()

            const cookie = getCookie("testudoAuthorization")

            const options = {
                method: 'POST',
                headers: { 'Connection': 'Keep-Alive' },
                body: binary
            }

            fetch(`${BaseURL}/audio/${cookie}/${name}`, options)
                .then(response => {
                    if (response.status == 413) {
                        alert("Data takes more than 12GB space. Please remove something to continue")
                        location.reload()
                    }
                    if (response.status == 403) {
                        console.log(response.status)
                        alert("Uploaded file was not valid audio file!")
                    }
                    if (!response.ok) {
                        throw new Error('Network response was not ok')
                    }
                    return response.json()
                })
                .then(data => {
                    console.log('File saved successfully:', data)
                    audioFiles[id] = name
                })
                .catch(error => {
                    console.error('There was a problem with your fetch operation:', error)
                })
        }
        reader.readAsArrayBuffer(input.files[0])
    }

    setSelectedValue(value: string, id: string) {
        const li = document.getElementById(id)
        let textarea = undefined
        let input = undefined
        let payloadInput = li.getElementsByClassName('payload-input')[0]
        let codeStyle = li.getElementsByClassName('code-style')[0]

        switch (value) {
            case 'Code':
                if (codeStyle) {
                    codeStyle.remove()
                }
                const codeInput = document.createElement('input')
                payloadInput.parentNode.insertAdjacentElement("beforeend", codeInput)
                codeInput.style.borderRadius = "6px"
                codeInput.style.backgroundColor = "#1e1f22"
                codeInput.style.padding = "2px"
                codeInput.style.margin = "auto"
                codeInput.style.marginTop = "10px"
                codeInput.style.width = "calc(100% - 220px)"
                codeInput.classList.add("code-style")
                codeInput.style.display = "block"
                codeInput.placeholder = "Language name"

                textarea = document.createElement('textarea')
                payloadInput.parentNode.replaceChild(textarea, payloadInput)
                textarea.style.minHeight = "200px"
                textarea.style.borderRadius = "6px"
                textarea.style.backgroundColor = "#1e1f22"
                textarea.style.padding = "2px"
                textarea.style.margin = "auto"
                textarea.style.marginTop = "10px"
                textarea.style.width = "calc(100% - 220px)"
                textarea.classList.add("payload-input")
                textarea.style.display = "block"
                break;
            case 'URL':
                if (codeStyle) {
                    codeStyle.style.display = "none"
                }
                input = document.createElement('input')
                payloadInput.parentNode.replaceChild(input, payloadInput)
                input.style.borderRadius = "6px"
                input.style.backgroundColor = "#1e1f22"
                input.style.padding = "2px"
                input.style.margin = "auto"
                input.style.marginTop = "10px"
                input.style.width = "calc(100% - 220px)"
                input.classList.add("payload-input")
                input.style.display = "block"
                break;
            case 'Audio':
                if (codeStyle) {
                    codeStyle.style.display = "none"
                }
                input = document.createElement('input')
                payloadInput.parentNode.replaceChild(input, payloadInput)
                input.type = "file"
                input.style.borderRadius = "6px"
                input.style.backgroundColor = "#1e1f22"
                input.style.padding = "2px"
                input.style.margin = "auto"
                input.style.marginTop = "10px"
                input.style.width = "calc(100% - 220px)"
                input.classList.add("payload-input")
                input.style.display = "block"
                input.addEventListener("change", (e: any) => { this.onChangeAudioFile(e, id) })
                break;
            default:
                if (codeStyle) {
                    codeStyle.style.display = "none"
                }
                textarea = document.createElement('textarea')
                payloadInput.parentNode.replaceChild(textarea, payloadInput)
                textarea.style.minHeight = "200px"
                textarea.style.borderRadius = "6px"
                textarea.style.backgroundColor = "#1e1f22"
                textarea.style.padding = "2px"
                textarea.style.margin = "auto"
                textarea.style.marginTop = "10px"
                textarea.style.width = "calc(100% - 220px)"
                textarea.classList.add("payload-input")
                textarea.style.display = "block"
                break;
        }
    }

    onPlusNoteClick(data: any) {
        const showActiveListIndex = this.props.showActiveListIndex
        const allData = structuredClone(this.props.getAllData)
        const items = structuredClone(allData.main[showActiveListIndex].items)

        const result = window.prompt("Note name", "");

        if (result === null || result.trim().length === 0) {
            return alert("Name cannot be empty")
        }

        let newContent = undefined

        if (data.content) {
            newContent = [
                ...data.content, {
                    "name": result,
                    "id": uuidv4(),
                    "type": "Text",
                    "payload": ""
                }]
        } else {
            newContent = [{
                "name": result,
                "id": uuidv4(),
                "type": "Text",
                "payload": ""
            }]
        }

        console.log(allData.main[showActiveListIndex])

        if (items) {
            for (let i = 0; i < items.length; ++i) {
                if (items[i].id == data.id) {
                    allData.main[showActiveListIndex].items[i].content = newContent

                    const options = {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(allData)
                    }
                    sendPutRequest(options)

                    // Asetetaan uudet listan jäsenet
                    this.props.setTableItems(allData.main[showActiveListIndex].items[i])
                    this.props.setAllData(allData)
                    this.forceUpdate()

                    return // Poistutaan loopista
                }
            }
        }
    }

    onOpenClick() {
        const innerContainer = document.getElementById("inner-container")
        const ul = innerContainer.getElementsByClassName("table-list")[0]
        const listItems = ul.getElementsByTagName("li")

        for (const [key, value] of Object.entries(this.arrowBooleans)) {
            this.arrowBooleans[key] = true
        }

        for (let i = 0; i < listItems.length; ++i) {
            const buttons = listItems[i].getElementsByClassName("buttons")[0]
            const arrow = buttons.getElementsByClassName("arrow")[0]
            arrow.style.transform = "rotate(45deg)"

            listItems[i].getElementsByClassName("hidden-element")[0].style.display = "flex"
            listItems[i].style.height = "auto"
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
                                                draggable={this.props.getDraggingOn}
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
                                                draggable={this.props.getDraggingOn}
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
                                                draggable={this.props.getDraggingOn}
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
                                                        onChange={(e) => this.onChangeAudioFile(e, d.id)} />
                                                </div>

                                                <p className='item-name'>
                                                    {d.name}
                                                </p>
                                                <div className='hidden-element'>
                                                    <audio className='audio' controls="controls" autobuffer="autobuffer">
                                                        <source src={`${BaseURL}/audio/${set_cookie}/${d.payload}`} />
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
                                                draggable={this.props.getDraggingOn}
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
            if (this.props.data) {
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

export default InnerContainer

