export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}

export const URL = "http://192.168.0.103:5000/data"


export function onMouseClickTable(d: any, i: any) {
    // Annetaan 10ms aikaa taululle renderöityä
    setTimeout(() => {
        localStorage.setItem("activeFolder", i.toString())

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
      }, 10);
}

export function sendPutRequest(options: any) {
    fetch(URL, options)
        .then(response => {
            if (response.status == 413) {
                alert("Notebooks are too large! Delete something to free memory.")
                location.reload(true)
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

