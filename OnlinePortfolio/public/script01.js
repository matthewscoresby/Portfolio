let projectJsonText;
let projectNum = 0;

fetch('./projectsData.json')
    .then((response) => response.json())
    .then((json) => projectJsonText = json);


function VisitProjectWebsite(url)
{
    window.open(url);
}

function TransitionPastProjects(projectBoxElement)
{
    setInterval(() => {
        projectNum += 1;
        let keys = Object.keys(projectJsonText);
        if (projectNum >= keys.length){
            projectNum = 0;
        }

        projectBoxElement.style.opacity = 0;

        setTimeout(() => {
            const newProjectHTML = `
            <h2 id="ProjectHeader"> ${projectJsonText[keys[projectNum]].Name} </h2>

            <text id="ProjectText"> ${projectJsonText[keys[projectNum]].Text} </text>

            <button class="Button" onClick="VisitProjectWebsite('${projectJsonText[keys[projectNum]].WebsiteURL}')"> 
                ${projectJsonText[keys[projectNum]].Name}
            </button>

            <div id="ProjectPicture" class="${projectJsonText[keys[projectNum]].Pixelated}"> 
                <img src="${projectJsonText[keys[projectNum]].Picture}" class="Img">
            </div>
        `
            projectBoxElement.innerHTML = newProjectHTML;

            projectBoxElement.style.opacity = 1;
        },2000)

    },15000)
}

async function submitForm(e) {
    let nameInput = document.getElementById("nameInput");
    let emailInput = document.getElementById("emailInput");
    let messageInput = document.getElementById("messageInput");

    let name = nameInput.value;
    let email = emailInput.value;
    let message = messageInput.value;

    document.getElementById("EmailForm").innerHTML = 
    `
    <text id="ConfermationEmail">Your Email has been Sent! <br> Thanks for Reaching Out!</text>
    <button id="closePopup" class="inputButton">Close</button>
    `;

    await sendMessage(name, email, message)
}

window.addEventListener("load", (event) => {
    const projectBoxElement = document.getElementById("ProjectSectionBox");
    TransitionPastProjects(projectBoxElement)

    // JavaScript to control the popup
    const showPopupButton = document.getElementById("GetStartedButton");
    const closePopupButton = document.getElementById("closePopup");
    const popup = document.getElementById("myPopup");
    const submitEmail = document.getElementById("sendmessage");

    showPopupButton.addEventListener("pointerdown", () => {
        popup.style.display = "block";
    });

    closePopupButton.addEventListener("pointerdown", () => {
        popup.style.display = "none";
    });
});