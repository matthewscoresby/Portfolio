// Defining Variables Uniquely to Typescript where you specifiy the type

let petHappiness: number;
let petHappinessMultipier: number = 5;

let petHealth: number;
let petHealthMultipier: number = 5;

let canFeed: boolean = true;
let isEating: boolean = false;
let activeCookies: string[] = [];
let intervalId;

let petStats: { health: number; happiness: number; firstDay: Date; lastDay: Date, petName: string, battlesWon: number, gold: number }

// When the window opens the program begins watching for different events
window.addEventListener("DOMContentLoaded", () => {
    const petElement = document.getElementById("petImg") as HTMLImageElement;
    const feedButton = document.getElementById("foodImg") as HTMLButtonElement;
    const form = document.getElementById("PetNameForm") as HTMLFormElement;

    // makes the pet happy when the user hovers their mouse over it
    petElement.addEventListener("mouseover", () => {
        petElement.src = "./images/slimeHappy.gif";
    });

    petElement.addEventListener("mouseleave", () => {
        petElement.src = "./images/slimeIdle.gif";
    });

    // Trys to spawn heart and make the pet more happy on click
    petElement.addEventListener("click", () => {
        SpawnHeart();
    });

    // if the food bucket is tipped then the pet looks up and it checks if it can spawn a cookie
    feedButton.addEventListener("pointerdown", () => {
        if (!isEating){
            petElement.src = "./images/slimeWaiting.gif";
        }
        if ((petHealth + (activeCookies.length * petHealthMultipier)) <= 100)
        {
            intervalId = setInterval(dropCookie, 500)
        }
    });

    // when the user stops clicking on the food bucket it checks if it dropped a cookie
    // if yes then feedpet triggers the pet to start eating
    // if no then the slime returns to idle anmation
    feedButton.addEventListener("pointerup", () => {
        if (activeCookies.length === 0){
            petElement.src = "./images/slimeIdle.gif";
        }
        else {
            FeedPet(petElement);
        }
        clearInterval(intervalId)
    });

    form.addEventListener("submit", function (event) {
        const petNameinput = document.getElementById("petNameInput") as HTMLInputElement;
        const petNameValue = petNameinput.value;
        SetPetName(petNameValue)
    });

    // gets stats at the very begining of game
    GetPetStats()
    CalculateHealthAndHappiness()
});

// Sets the PetName if the user submits a name
function SetPetName(petNameValue) {
    document.getElementById("PetName").innerHTML = petNameValue;
    petStats.petName = petNameValue;
    SetPetStats()
}

// Gets the Pets Stats from Local Storage, if they aren't there then it sets them
function GetPetStats() {
    let today: Date = new Date();
    petStats = JSON.parse(localStorage.getItem("petStats"));

    if (petStats === null) {
        petStats = { health: 100, happiness: 100, firstDay: today, lastDay: today, petName: "", battlesWon: 0, gold: 100};
        localStorage.setItem("petStats", JSON.stringify(petStats));
        document.getElementById("happinessProgress")!.style.width = petHappiness + "%";
        document.getElementById("healthProgress")!.style.width = petHealth + "%";
    }

    petHappiness = petStats.happiness;
    petHealth = petStats.health;
    petStats.firstDay = new Date(petStats.firstDay);
    let daysSurvived: number = (today.getTime() - petStats.firstDay.getTime()) / (1000 * 60 * 60 * 24);

    // sets the documents elements on load based on local storage
    document.getElementById("DaysSurvived")!.innerText = String(Math.floor(daysSurvived));
    document.getElementById("PetName")!.innerText = petStats.petName.toUpperCase();
    document.getElementById("BattlesWon")!.innerText = String(petStats.battlesWon);
    document.getElementById("Gold")!.innerText = String(petStats.gold);
}

// Calculates how unhappy and unhealthy the pet is based on the time that has passed
// Reports pet as dead
function CalculateHealthAndHappiness(){
    petStats.lastDay = new Date(petStats.lastDay);

    let today: Date = new Date();
    // Each hour that has passed is counted as 1 less health
    let health: number = ((today.getTime() - petStats.lastDay.getTime()) / (1000 * 60 * 60) * 1);

    // Each hour that has passed is counted as 5 less happiness
    let happiness: number = ((today.getTime() - petStats.lastDay.getTime()) / (1000 * 60 * 60) * 5);

    //(Note to future self: consider making these multipliers)

    petHealth -= health;
    petHappiness -= happiness;

    if (petHealth < 0)
    {
        console.log("YOUR PET DIED")
        petHealth = 0;
    }

    if (petHappiness < 0)
    {
        console.log("YOUR PET RAN AWAY")
        petHappiness = 0;
    }

    document.getElementById("happinessProgress")!.style.width = petHappiness + "%";
    document.getElementById("healthProgress")!.style.width = petHealth + "%";

    petStats.lastDay = today;
    SetPetStats()
}

// Sets updated stats in the local storage
function SetPetStats(){
    localStorage.setItem("petStats",JSON.stringify(petStats));
}

// Spawns the heart when the pet is clicked
function SpawnHeart(){
    // only runs if the pet has less than 100 happiness (happinessMax will eventually be a variable)
    if (petHappiness < 100)
    {
        const emitterElement = document.getElementById("emitter")
        const heartID = String(emitterElement.children.length);
        const heart = `<img src="./images/heart.png" class="heart" id="${heartID}">`;
        emitterElement.insertAdjacentHTML("beforeend", heart)

        // This increases the pets happiness
        petHappiness += petHappinessMultipier;

        if (petHappiness > 100)
        {
            petHappiness = 100;
        }

        const happinessBar = document.getElementById("happinessProgress");
        happinessBar.style.width = String(petHappiness) + "%";

        // sets pets stats to local storage
        petStats.happiness = petHappiness;
        SetPetStats()

        // Timeout function used to give it time to float to top before removal
        setTimeout(() => {

            // trys to delete the heart Element
            try{
                document.getElementById(heartID).remove();
            } catch (error){
                console.log("Missing heart Element", error.message)
            }

        }, 4000);
    }
}

// Drops cookie from container
function dropCookie(){
    if ((petHealth + (activeCookies.length * petHealthMultipier)) < 100) {
        const foodBucketElement = document.getElementById("foodBucket")
        const cookieID = String(foodBucketElement.children.length);
        const cookie = `<img src="./images/Cookie.png" class="cookie" id="${cookieID}">`;
        foodBucketElement.insertAdjacentHTML("beforeend", cookie)
        activeCookies.push(cookieID);

        // Again Timeout function used to set cookie final location randomly after it falls
        setTimeout(() => {
            const randInt = String(getRandomInt(-100,100))
            document.getElementById(cookieID).style.transform = `translate(${randInt}%, 400%)`;
        },900);
    }
    else {
        clearInterval(intervalId)
    }
}

// Turns on the eating animation aswell as increases the pets health
function FeedPet(petElement) {
    isEating = true;
    const loops = activeCookies.length;

    function removeNextCookie(index) {
        if (index < loops) {
            petElement.src = "./images/slimeEating.gif";
            petHealth += petHealthMultipier;

            if (petHealth > 100)
            {
                petHealth = 100;
            }

            // sets pets stats to local storage
            petStats.health = petHealth;
            SetPetStats()

            const HealthBar = document.getElementById("healthProgress");
            HealthBar.style.width = String(petHealth) + "%";

            setTimeout(() => {
                let removedCookie = activeCookies.pop();

                // trys to delete the removedCookie Element
                try{
                    document.getElementById(removedCookie).remove();
                } catch (error){
                    console.log("Missing Cookie Element", error.message)
                }
                petElement.src = "./images/slimeIdle.gif";

                // waits a random amount of time between each cookie (for realism)
                let waitBetweenEating = getRandomInt(1000, 5000);
                setTimeout(() => {
                    removeNextCookie(index + 1);
                }, waitBetweenEating);
            }, 1000);
        } else {
            petElement.src = "./images/slimeIdle.gif";
            isEating = false;
        }
    }

    removeNextCookie(0); // Start removing cookies
}

// Returns a random number 
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}