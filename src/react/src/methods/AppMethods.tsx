export const BaseURL = "http://localhost:5000"
export const DataURL = BaseURL + "/data"

export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })
}

export function getCookie(name: string) {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
}

export function onMouseClickTable(d: any, i: any) {
    const table: any = document.getElementById(d.id)

    if (table) {
        table.style.backgroundColor = "#2e2d38"

        const allTables = document.getElementsByClassName("item")

        for (const elem of allTables) {
            const trash = elem.getElementsByClassName("trash-icon")[0]
            const edit = elem.getElementsByClassName('edit-folder-icon')[0]

            if (elem.id !== d.id) {
                trash.style.display = "none"
                edit.style.display = "none"
                elem.style.backgroundColor = ""
            }
            else {
                trash.style.display = "block"
                edit.style.display = "block"
            }
        }
    }
}

export function sendPutRequest(options: any) {
    let cookie = getCookie("testudoAuthorization")

    fetch(`${DataURL}/${cookie}`, options)
    .then(response => {
        if (response.status == 413) {
            alert("Data takes more memory than 6GB. Disable Notebooks or delete items.")
            location.reload()
        }
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }
        return response.json()
    })
    .then(data => {
        console.log('Resource updated successfully:', data)
    })
    .catch(error => {
        console.error('There was a problem with your fetch operation:', error)
    })
}

export function sendDeleteRequest(options: any) {
    let cookie = getCookie("testudoAuthorization")

    fetch(`${DataURL}/${cookie}`, options)
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


