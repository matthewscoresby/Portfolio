let GameStarted = false;
let playerGameID = "";
let playerID = "";
let playerName = "";
let playerhost = "";
let added = false;
let forceDrawChecked = false;
let currentPlayerNum = 0;
let newCard = [];
let Tempcard = 0;
let canPlay = true;
let StoredGameData = {}
let buttonClicked = false;
let localRotation = "right";
var referenceDeck = {};


// Getting Reference Deck
fetch('referenceDeck.json')
.then((response) => response.json())
.then((deck) => referenceDeck = deck.Deck);


// FIREBASE #################################################


// FIREBASE: Creates User and Game if hosted
function login(host, GameID, name){

    const localName = localStorage.getItem("playerName");
    if (localName === null || localName != name)
    {
        localStorage.setItem("playerName", name);
    }

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            playerID = user.uid;
            playerRef = firebase.database().ref(`${GameID}/players/${playerID}`);

            const playersNodeRef = firebase.database().ref(`${GameID}/players`);

            playersNodeRef.once('value')
                .then((snapshot) => {
                    const playerCount = snapshot.numChildren();
                    
                    playerRef.set({
                        id: playerID,
                        UserName: name,
                        NewCards: [[""]],
                        IsHost: host,
                        playerNum: playerCount+1,
                        CardsLeft: 0,
                        UserCards: ""
                    });

                    if (host) {
                        GameRef = firebase.database().ref(`${GameID}/GameData`);
                        GameRef.set({
                            GameID: GameID,
                            Deck: referenceDeck,
                            CurrentPlayer: "",
                            LastPlayer: "",
                            TopCard: [""],
                            NextAction: "",
                            DrawAmount: 0,
                            CanJoin: true,
                            Rotation: "right",
                            WinnerID: "",
                            WinnerName: "",
                            Host: playerID,
                            LastCardDetected: "",
                        });

                        GameRef.onDisconnect().remove();
                        playerRef.onDisconnect().remove();
                    }

                    playerRef.onDisconnect().remove();

                    playerGameID = GameID;
                    playerhost = host;
                    playerName = name;

                    initGame(GameID, host, name);
                })
                .catch((error) => {
                    console.error("Error fetching player count:", error);
                });
        } else {
            // You're logged out.
        }
    });
    
    firebase.auth().signInAnonymously().catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
        console.log(errorCode, errorMessage);
    });
}

// FIREBASE: Joins the game
async function JoinGame()
{
    const GameID = document.getElementById("JoinInput").value.toUpperCase();
    const name = document.getElementById("NameInput").value.toUpperCase();

    const gameRef = firebase.database().ref(GameID);

    gameRef.once('value')
        .then((snapshot) => {
            const gameData = snapshot.val();
            if (gameData === null)
            {
                document.getElementById("ErrorText").innerHTML = "Game Doesn't Exist";
            } 
            else if (Object.keys(gameData.players).length === 9)
            {
                document.getElementById("ErrorText").innerHTML = "Lobby Full";
            }
            else if (gameData.GameData.CanJoin === false)
            {
                document.getElementById("ErrorText").innerHTML = "Game Already Started";
            }
            else if (name.length > 9) {
                document.getElementById("ErrorText").innerHTML = "Max Characters is 8"
                document.getElementById("NameInput").value = "";
            }
            else 
            {
                AddLoadingScreen();
                login(false, GameID, name);
            }
        })
        .catch((error) => {
            console.error("Error fetching game data:", error);
        }
    );
}

// FIREBASE: Hosts Game
function HostGame()
{
    const GameID = generateGameID();
    const gameRef = firebase.database().ref(GameID);
    const name = document.getElementById("NameInput").value.toUpperCase();

    gameRef.once('value')
        .then((snapshot) => {
            const gameData = snapshot.val();

            if (gameData !== null) {
                document.getElementById("ErrorText").innerHTML = "GameID in Use"
            } 
            else if (name.length > 9) {
                document.getElementById("ErrorText").innerHTML = "Max Characters is 8"
                document.getElementById("NameInput").value = "";
            }
            else {
                AddLoadingScreen();
                login(true, GameID, name);
            }
        })
        .catch((error) => {
            console.error("Error fetching game data:", error);
    });
}


// FIREBASE: responsible for watching for changes in variables and updates other functions
function initGame(GameID, host) {
    document.getElementById("BeginMenu").style.visibility = 'hidden';
    document.getElementById("GameID").innerHTML = "GameID: " + GameID;

    if (host != true)
    {
        document.getElementById("StartButton").style.visibility = "hidden";
        document.getElementById("LeaveGameButton").style.visibility = "visible";
    }

    const GameRef = firebase.database().ref(`${GameID}/GameData`);

    const allPlayersRef = firebase.database().ref(`${GameID}/players`);

    const currentPlayerRef = allPlayersRef.child(playerID);

    const GameNextPlayerRef = GameRef.child("CurrentPlayer");

    const GameLastTopCardRef = GameRef.child("TopCard");

    const GameWinnerRef = GameRef.child("WinnerID");

    const GameLastCardRef = GameRef.child("LastCardDetected");

    // Runs Every Time the Winner Changes
    GameWinnerRef.on('value', (snapshot) => {
        WinnerData = snapshot.val();
        allPlayersRef.once('value', (snapshot) => {
            const allPlayersData = snapshot.val();
            for (const playerId in allPlayersData)
            {
                if (playerId === WinnerData){document.getElementById(playerId+"-crown").classList.remove("hidden");}
                else{document.getElementById(playerId+"-crown").classList.add("hidden");}
            }
        })
    })

    // Runs Every Time Top Card Changes
    GameLastTopCardRef.on('value', (snapshot) => {
        TopCardData = snapshot.val();
        if (TopCardData.length > 1)
        {
            SetTopCardElement(TopCardData)
        }
    })

    // Runs If the Last Card Player Changes
    GameLastCardRef.on('value', (snapshot) => {
        LastCardPlayerData = snapshot.val();
        if (LastCardPlayerData != "")
        {
            document.getElementById("lastCardButton").classList.remove("hidden");
        }
        else
        {
            document.getElementById("lastCardButton").classList.add("hidden");
        }
    })

    // Runs if the GameData Changes
    GameRef.on('value', (snapshot) => {

        const GameData = snapshot.val();

        SetDrawIndicator(GameData.DrawAmount)
        HideColorButtons(GameData.TopCard[1] === "wildCard");
        UpdateRotationIndicator(GameData)

        if(GameData.WinnerName != "")
        {
            GameStarted = false;
            ShowEndGameScreen(GameData.WinnerName)
            if (GameData.Host === playerID)
            {
                ResetGame(GameData.WinnerID)
            }
        }

        StoredGameData = GameData;

    }, (error) => {
        console.error("Error fetching game data:", error);
    });

    // Listen for player enter
    allPlayersRef.on('child_added', (addedPlayerSnapshot) => {
        const addedPlayerData = addedPlayerSnapshot.val();

        allPlayersRef.once('value', (snapshot) => {

            const allPlayersData = snapshot.val();
    
            const sortedPlayers = Object.values(allPlayersData).sort((a, b) => a.playerNum - b.playerNum);
    
            SetBoard(sortedPlayers);
    
        }, (error) => {
            console.error("Error fetching game data:", error);
        });

        if(added)
        {
            playNotificationAnimation("green", addedPlayerData.UserName, "joined");
        }

        console.log(`Player ${addedPlayerData.UserName} (${addedPlayerData.id}) has Joined!`);
    }, (error) => {
    console.error("Error listening for player Added:", error);
    });

    setTimeout(function() {
        added = true;
    }, 100);

    // Listen for player removal
    allPlayersRef.on('child_removed', (removedPlayerSnapshot) => {
        const removedPlayerData = removedPlayerSnapshot.val();
        console.log(`Player ${removedPlayerData.UserName} (${removedPlayerData.id}) has been removed.`);
        document.getElementById(removedPlayerData.id+"-playerid").parentElement.innerHTML = "";

        if (removedPlayerData.IsHost)
        {
            setNextHost();
        }

        adjustForRemovedPlayer(removedPlayerData)

        playNotificationAnimation("red", removedPlayerData.UserName, "left");

    }, (error) => {
    console.error("Error listening for player removal:", error);
    });

    // Runs if only this player changes
    currentPlayerRef.on('value', (snapshot) => {
        const playerData = snapshot.val();   
    
        if (playerData.NewCards[0][0] != "")
        {
            updateUserDeck(playerData.NewCards)
            .then(() => {

                const updates = {};
                updates[`${playerID}/NewCards`] = [[""]];

                if(playerData.UserCards)
                {
                    const newUserCards = playerData.NewCards.concat(playerData.UserCards);
                    updates[`${playerID}/UserCards`] = newUserCards;
                }
                else
                {
                    const newUserCards = playerData.NewCards;
                    updates[`${playerID}/UserCards`] = newUserCards;
                }
                return allPlayersRef.update(updates);
            })
            .catch((error) => {
                console.error("Error updating user deck:", error);
            });
        }
        if (playerData.UserCards != null)
        {
            playerRef.update({ CardsLeft: playerData.UserCards.length });
        }

    }, (error) => {
        console.error("Error fetching game data:", error);
    });

    // Runs Every Time the Current Player Changes
    GameNextPlayerRef.on('value',  (snapshot) => {
        const currentPlayer = snapshot.val(); 
        if (currentPlayer != "")
        {
            allPlayersRef.once('value', (snapshot) => {
                const players = snapshot.val();
                UpdateNextPlayerHTML(players,currentPlayer);

                //Updates Player Numbers
                const sortedPlayers = Object.values(players).sort((a, b) => a.playerNum - b.playerNum)
                UpdateBoard(sortedPlayers);
            });
        }
    });
}

// Replensishes the deck if its empty
function replenishTheDeck()
{
    //fix this to be more dynamic ( this needs to take into account the cards on table )
    return referenceDeck;
}

// FIREBASE: Updates the deck of the deck of a specific player with a specified amount of cards
function UpdateDeck(drawnAmount, playerid)
{
    const GameRef = firebase.database().ref(playerGameID+'/GameData');
    const playerRef = firebase.database().ref(playerGameID+'/players/'+playerid);

    GameRef.once('value', (snapshot) => {
        const gameData = snapshot.val();
        var currentDeck = gameData.Deck;

        var NewCards = [];

        for (let i = 0; i < drawnAmount; i++) {
            var keys = Object.keys(currentDeck);

            if (keys.length === 0) {
                currentDeck = replenishTheDeck();
                keys = Object.keys(currentDeck);
            }

            var randIndex = getRandomNumber(0, keys.length);
            var randKey = keys[randIndex];
            var card = currentDeck[randKey];

            NewCards.push(card);

            currentDeck.splice(randIndex, 1);
        }

        GameRef.update({ Deck: currentDeck });
        playerRef.update({ NewCards: NewCards });

        CheckIfCanPlay(card).then((canPlay) => {
            if (!canPlay || drawnAmount > 1) {
                EndTurn(null, false);
            }
        });
    });
}

// FIREBASE: Sets the players to the correct spots in relation to User
function SetNextPlayer(playerNum, type, rotation)
{
    const GameRef = firebase.database().ref(playerGameID+'/GameData');
    const playersRef = firebase.database().ref(playerGameID+'/players');

    var nextPlayer = 0;

    playersRef.once('value', (snapshot) => {
        const playersData = snapshot.val();
        const playersAmount = Object.keys(playersData).length;

        if (playersAmount <= 2 && type === "skip")
        {
            GameRef.update({ CurrentPlayer: playerID });
        }
        else if (playersAmount <= 2 && type === "reverse")
        {
            GameRef.update({ CurrentPlayer: playerID });
        }
        else
        {
            if (type === "skip" && rotation === "right")
            {
                if (playerNum === playersAmount)
                {
                    playerNum = 1;
                }
                else
                {
                    playerNum += 1;
                }
            }

            if (type === "skip" && rotation === "left")
            {
                if (playerNum === 1)
                {
                    playerNum = playersAmount;
                }
                else
                {
                    playerNum -= 1;
                }
            }

            if (rotation === "right")
            {
                if (playerNum === playersAmount){
                    nextPlayer = 1;
                }
                else{
                    nextPlayer = playerNum + 1;
                }
            }
            
            if (rotation === "left")
            {
                if (playerNum === 1){
                    nextPlayer = playersAmount;
                } 
                else{
                    nextPlayer = playerNum - 1;
                }
            }

            for (let i = 0; i < playersAmount; i++) {
                if (Object.values(playersData)[i].playerNum === nextPlayer)
                {
                    GameRef.update({ CurrentPlayer: Object.values(playersData)[i].id });
                }
            }
        }
    });
}

function ChooseNextPlayer(playerData, card, discard)
{
    const GameRef = firebase.database().ref(playerGameID+'/GameData');
    GameRef.once('value', (snapshot) => {
        const gameData = snapshot.val();
        rotation = gameData.Rotation;
        var drawAmount = gameData.DrawAmount;
        if (discard)
        {
            GameRef.update({ TopCard: card }).then(() => {
                if (card[0] === "Reverse" && rotation === "right")
                {
                    GameRef.update({ NextAction: ""});
                    GameRef.update({ Rotation: "left"});
                    SetNextPlayer(playerData.playerNum, "reverse", "left");
                }
                else if(card[0] === "Reverse" && rotation === "left")
                {
                    GameRef.update({ NextAction: ""});
                    GameRef.update({ Rotation: "right"});
                    SetNextPlayer(playerData.playerNum, "reverse", "right");
                }
                else if(card[0] === "Skip")
                {
                    GameRef.update({ NextAction: ""});
                    SetNextPlayer(playerData.playerNum, "skip", rotation);
                }
                else if(card[0] === "Draw2")
                {
                    drawAmount = drawAmount + 2;
                    GameRef.update({ NextAction: "Draw2"});
                    GameRef.update({ DrawAmount: drawAmount })
                    SetNextPlayer(playerData.playerNum, "", rotation);
                }
                else if(card[0] === "WildDraw4")
                {
                    drawAmount = drawAmount + 4;
                    GameRef.update({ NextAction: "WildDraw4" });
                    GameRef.update({ DrawAmount: drawAmount })
                    SetNextPlayer(playerData.playerNum, "", rotation);
                }
                else
                {
                    GameRef.update({ NextAction: ""});
                    SetNextPlayer(playerData.playerNum, "", rotation);
                }
            })
        }
        else
        {
            SetNextPlayer(playerData.playerNum, "", rotation);
        } 
    });

    GameRef.update({ LastPlayer: playerID });
}

// FIREBASE: Updates the users deck, top card, and sets user as the last player
function EndTurn(card, discard)
{
    const GameRef = firebase.database().ref(playerGameID+'/GameData');
    const playerRef = firebase.database().ref(playerGameID+'/players/'+playerID);
    
    playerRef.once('value', (snapshot) => {
        const playerData = snapshot.val();
        const currentDeck = playerData.UserCards;
        var rotation = "";
        var UpdatedDeck = [];
        
        if (discard)
        {
            for (let i = 0; i < currentDeck.length; i++) {
                if (currentDeck[i][2] != String(card[2])) {
                    UpdatedDeck.push(currentDeck[i]);
                }
            }
        }
        else
        {
            UpdatedDeck = currentDeck;
        }

        playerRef.update({ UserCards: UpdatedDeck })
        .then(() => {
            playerRef.once('value', (snapshot) => {
                const playerData = snapshot.val();
                if (playerData.UserCards === undefined)
                {
                    GameRef.update({ WinnerID: playerID});
                    GameRef.update({ WinnerName: playerName});
                }
                // UNO BUTTON - NOT FINISHED
                //if (UpdatedDeck.length < 1)
                //{
                    //document.getElementById("lastCardButton").classList.remove("hidden");
                    //GameRef.update({LastCardDetected: playerID});
                //}
                else
                {
                    ChooseNextPlayer(playerData, card, discard);
                }
            });
        });
    });
}

//FIREBASE: Check if the user can play
function CheckIfCanPlay(card) {
    return new Promise((resolve, reject) => {
        const GameRef = firebase.database().ref(playerGameID + '/GameData');

        GameRef.once('value', (snapshot) => {
            const gameData = snapshot.val();

            if (playerID === gameData.CurrentPlayer) {
                if (gameData.DrawAmount === 0) {
                    if (gameData.TopCard[0] === "" || card[0] === gameData.TopCard[0] || card[1] === gameData.TopCard[1] || card[1] === "wildCard") {
                        console.log("Matching Card - Color or Picture");
                        resolve(true);
                    } 
                    else {
                        resolve(false);
                    }
                } else if (gameData.DrawAmount != 0) {
                    if (gameData.TopCard[0] === "WildDraw4" && card[0] === "WildDraw4") {
                        console.log("Draw 4 on Draw 4");
                        resolve(true);
                    } 
                    else if (gameData.TopCard[0] === "Draw2" && card[0] === "Draw2") {
                        console.log("Draw 2 on Draw 2");
                        resolve(true);
                    } 
                    else {
                        resolve(false);
                    }
                } else {
                    console.log("Cannot Play That Card");
                    resolve(false);
                }
            } else {
                console.log("Not Your Turn");
                resolve(false);
            }
        });
    });
}


//FIREBASE: Reset (Amost) All Variables 

function ResetPlayers()
{
    const PlayersRef = firebase.database().ref(playerGameID+'/players');

    PlayersRef.once('value', (snapshot) => {
        const playerData = snapshot.val();
        
        for (const playerId in playerData) {
            if (playerData.hasOwnProperty(playerId)) {
                const playerInfo = playerData[playerId];
                playerRef = firebase.database().ref(`${playerGameID}/players/${playerId}`);
                playerRef.update({ NewCards: [[""]]});
                playerRef.update({ CardsLeft: 0});
                playerRef.update({ UserCards: ""});
            }
        }
    });
}

async function ResetGame(winnerId)
{
    const GameRef = firebase.database().ref(playerGameID+'/GameData');
    GameRef.set({
        GameID: GameID,
        Deck: referenceDeck,
        CurrentPlayer: "",
        LastPlayer: "",
        TopCard: [""],
        NextAction: "",
        DrawAmount: 0,
        CanJoin: true,
        Rotation: "right",
        WinnerName: "",
        WinnerID: winnerId,
        Host: playerID,
    });

    await ResetPlayers();

    document.getElementById("StartButton").style.visibility = "visible";
    document.getElementById("LeaveGameButton").style.visibility = "hidden";
}


// FIREBASE: Sets the first player in the array to be the next host
function setNextHost()
{
    const playerRef = firebase.database().ref(`${playerGameID}/players/`).orderByKey().limitToFirst(1);

    GameRef = firebase.database().ref(`${playerGameID}/GameData`);
    Object.values(StoredGameData).Host = playerID;
    GameRef.set(StoredGameData);
    GameRef.onDisconnect().remove();

    playerRef.once('value', (snapshot) => {
        const playerData = snapshot.val();
        if (playerData) {
            const playerId = Object.keys(playerData)[0]; // Get the key of the first player
            const firstPlayerRef = firebase.database().ref(`${playerGameID}/players/${playerId}`);
            firstPlayerRef.update({ IsHost: true });

            GameRef.once('value', (snapshot) => {
                const gameData = snapshot.val();
                if(gameData.CanJoin === true && playerId === playerID)
                {
                    document.getElementById("StartButton").style.visibility = "visible";
                    document.getElementById("LeaveGameButton").style.visibility = "hidden";
                }
            })
        }
    });
}

function adjustForRemovedPlayer(removedPlayerData)
{

    const GameRef = firebase.database().ref(playerGameID+'/GameData');
    const playersRef = firebase.database().ref(playerGameID+'/players');
    var nextPlayer = 0;
    var previousPlayer = 0;

    playersRef.once('value', (snapshot) => {
        const playersData = snapshot.val();
        const playersAmount = Object.keys(playersData).length;

        GameRef.once('value', (snapshot) => {
            const GameData = snapshot.val();

            if (GameData.Rotation === "right")
            {
                if (removedPlayerData.playerNum >= playersAmount){
                    nextPlayer = 1;
                }
                else{
                    nextPlayer = removedPlayerData.playerNum + 1;
                }

                if (removedPlayerData.playerNum === 1){
                    previousPlayer = playersAmount
                } 
                else{
                    previousPlayer = removedPlayerData.playerNum - 1
                }
            }
    
            if (GameData.Rotation === "left")
            {
                if (removedPlayerData.playerNum === 1){
                    nextPlayer = playerAmount;
                }
                else{
                    nextPlayer = removedPlayerData.playerNum - 1;
                }

                if (removedPlayerData.playerNum >= playersAmount){
                    previousPlayer = 1
                } 
                else{
                    previousPlayer = removedPlayerData.playerNum + 1
                }
            }

            for (const playerId in playersData) {
                if (playersData.hasOwnProperty(playerId)) {
                    const player = playersData[playerId];
        
                    if (player.playerNum > removedPlayerData.playerNum) {
                        const newNum = player.playerNum - 1;
        
                        const playerRefToUpdate = firebase.database().ref(`${playerGameID}/players/${playerId}`);
                        
                        playerRefToUpdate.update({ playerNum: newNum })
                    }
                }
            }

            for (const playerId in playersData) {
                const player = playersData[playerId];
                if (GameData.CurrentPlayer === removedPlayerData.id && player.playerNum === nextPlayer)
                {
                    SetNextPlayer(previousPlayer, "", GameData.Rotation);
                    GameRef.update({ LastPlayer: removedPlayerData.id });
                }
    
                if (GameData.LastPlayer === removedPlayerData.id && player.playerNum === previousPlayer)
                {
                    GameRef.update({ LastPlayer: player.id });
                }
            }

        });
    });
}

function SetPlayerBeginingDecks()
{
    const PlayersRef = firebase.database().ref(playerGameID+'/players');

    PlayersRef.once('value', (snapshot) => {
        const playerData = snapshot.val();

        for (const playerId in playerData) {
        if (playerData.hasOwnProperty(playerId)) {
            const playerInfo = playerData[playerId];
            UpdateDeck(2, playerInfo.id);
        }
        }

        //Updates Player Numbers
        const sortedPlayers = Object.values(playerData).sort((a, b) => a.playerNum - b.playerNum)
        UpdateBoard(sortedPlayers);
    });
}

// EVENTS ################################################


// EVENT: Checks to see if can host game
function Host() {
    if(!buttonClicked)
    {
        if (document.getElementById("NameInput").value === "")
        {
            document.getElementById("ErrorText").innerHTML = "Set UserName First"
        }
        else {
            buttonClicked = true;
            HostGame();
        }
    }
}

// EVENT: Checks to see if can join game
function Join() {
    if(!buttonClicked)
    {
        if (document.getElementById("NameInput").value === "")
        {
            document.getElementById("ErrorText").innerHTML = "Set UserName First"
        }
        else {
            buttonClicked = true;
            JoinGame();
        }
    }
}


function SetBeginingTopCard()
{
    const GameRef = firebase.database().ref(playerGameID+'/GameData');
    GameRef.once('value', (snapshot) => {
        const gameData = snapshot.val();
        var currentDeck = gameData.Deck;
    
        var keys = Object.keys(currentDeck);
    
        if (keys.length === 0) {
            currentDeck = replenishTheDeck();
            keys = Object.keys(currentDeck);
        }
    
        var randIndex = getRandomNumber(0, keys.length);
        var randKey = keys[randIndex];
        var card = currentDeck[randKey];
    
        currentDeck.splice(randIndex, 1);
    
        GameRef.update({ Deck: currentDeck });
        GameRef.update({ TopCard: card });
    })


}

// EVENT: when host clicks start this innitiates the game
async function startGame()
{
    if (!GameStarted)
    {
        GameStarted = true;
        await SetPlayerBeginingDecks();
        await SetBeginingTopCard();
        const GameRef = firebase.database().ref(playerGameID+'/GameData');
        GameRef.once('value', (snapshot) => {
            const gameData = snapshot.val();
            if(gameData.CanJoin)
            {
                GameRef.update({ CanJoin: false })
            
                GameRef.update({ LastPlayer: playerID})
                SetNextPlayer(1, "", "left");
            
                document.getElementById("StartButton").style.visibility = "hidden";
                document.getElementById("LeaveGameButton").style.visibility = "visible";
            }
        });
    }
}

// EVENT: Recognizes when deck is clicked and triggers to update deck with 1 card
function drawCard()
{
    if (canPlay) {
        var drawAmount = 1;
        const GameRef = firebase.database().ref(playerGameID+'/GameData');

        GameRef.once('value', (snapshot) => {
            const gameData = snapshot.val();

            if (playerID === gameData.CurrentPlayer)
            {
                if (gameData.DrawAmount > 0)
                {
                    drawAmount = gameData.DrawAmount;
                    (GameRef.update({ DrawAmount: 0 }))
                }
        
                UpdateDeck(drawAmount, playerID);
            }   
        });
    }
}

// EVENT: Changes the color of wild if its a wild
function changeColor(color)
{
    const discardDiv = document.getElementById("DiscardedCard");
    discardDiv.classList.remove("wildCard");

    var cardColor = "";
    if (color === "green")
    {
        discardDiv.classList.add("greenCard");
        discardDiv.setAttribute("id","greenCard");
        cardColor = "greenCard";
    }
    else if (color === "red")
    {
        discardDiv.classList.add("redCard");
        discardDiv.setAttribute("id","redard");
        cardColor = "redCard";
    }
    else if (color === "blue")
    {
        discardDiv.classList.add("blueCard");
        discardDiv.setAttribute("id","blueCard");
        cardColor = "blueCard";
    }
    else if (color === "yellow")
    {
        discardDiv.classList.add("yellowCard");
        discardDiv.setAttribute("id","yellowCard");
        cardColor = "yellowCard";
    }

    const newCard = [Tempcard[0], cardColor, Tempcard[2]];
    canPlay = true;

    EndTurn(newCard, true);

    document.getElementById("ColorMenu").style.visibility = "hidden";
}

// EVENT: Recognizes which card was clicked for submission
function selectCard(cardId)
{
    if (canPlay) {
        const card = [referenceDeck[cardId][0],referenceDeck[cardId][1],cardId];
        CheckIfCanPlay(card).then((canPlay) => {
            if (canPlay) {
                NewCard = document.querySelector(`[data-card-id="${cardId}"]`);
    
            NewCard.remove();
        
            playerCardNum = String(document.getElementsByClassName("playerCard").length);
            document.getElementById("playerCards").style = 'grid-template-columns: repeat('+ playerCardNum +', minmax(50px, 1fr));'
    
            const GameRef = firebase.database().ref(playerGameID+'/GameData');
    
            GameRef.once('value', (snapshot) => {
                const gameData = snapshot.val();
                if (card[1] === "wildCard" && gameData.CurrentPlayer === playerID) {
                    SetTopCardElement(card);
                    Tempcard = card;
                    document.getElementById("ColorMenu").style.visibility = "visible";
                    canPlay = false;
                }
                else
                {
                    SetTopCardElement(card);
                    EndTurn(card, true);
                }
            });
            }
        });
    }
}

// EVENT: Copys link that can be shared
function copyLink()
{
    const customLink = window.location.origin + '/?gameID=' + playerGameID;
    navigator.clipboard.writeText(customLink);
    document.getElementById("CopyLinkButton").style.backgroundColor = "#16a34a";
}

//EVENT: Clears name input field
function ChangeName() {
    document.getElementById("NameInput").value = "";
}

// EVENT Last Card Event
function lastCard() {
    const GameRef = firebase.database().ref(playerGameID+'/GameData');
    GameRef.once('value', (snapshot) => {
        const gameData = snapshot.val();
        // Checking if the player who clicked is not the one who has the last card and that it has not been clicked allready
        if (gameData.LastCardDetected != playerID && gameData.LastCardDetected != "")
        {
            UpdateDeck(2, gameData.LastCardDetected)
        }
        else if(gameData.LastCardDetected != "")
        {
            GameRef.update({LastCardDetected: ""});
        }
        document.getElementById("lastCardButton").classList.add("hidden");
    });
}

// Leaves Game
function Leave()
{
    window.location.assign(window.location.origin);
}

// HTML ################################################

function UpdateNextPlayerHTML(players,currentPlayer)
{
    // sets the next player spot
    var elements = document.querySelectorAll('[data-player-id="' + currentPlayer + '"]');
    elements.forEach(function(element) {
        element.classList.add("NextPlayerAnimation");
        element.style.borderColor = "#16a34a";
    });

    const playerAmount = Object.keys(players).length;
    for (let i = 0; i < playerAmount; i++) {
        if (Object.values(players)[i].id != currentPlayer)
        {
            // sets the next player spot
            var elements = document.querySelectorAll('[data-player-id="' + Object.values(players)[i].id + '"]');
            elements.forEach(function(element) {
                element.classList.remove("NextPlayerAnimation");
                element.style.borderColor = "#000000";
            });
        }
    }
}

// HTML Creates Loading Screen While Player is Created
function AddLoadingScreen()
{
    const popUpBox = document.getElementById('BeginPopupBox');
    const loadingscreen = (`
    <h3 id="PopUpTitle">MATHUNO</h3>
    <h3 id="ErrorText"></h3>

    <input type="text" id="NameInput" placeholder = "UserName" class="PopUpInput"><br><br>
    <button id="NameButton" class="PopUpbtn btn"  onclick="ChangeName()">CHANGE</button>
    
    <input type="text" id="JoinInput" placeholder = "GameID" class="PopUpInput"><br><br>
    <button id="JoinButton" class="PopUpbtn btn" onclick="Join()">JOIN</button>

    <button id="HostButton" class="PopUpbtn btn" onclick="Host()">HOST</button>
    `)
    popUpBox.innerHTML = loadingscreen;
}

// HTML Updates Rotation Indicator
function UpdateRotationIndicator(GameData)
{
    const spinOrder = document.getElementById("OrderSpin");

    // Turns on Spin Order Animation if its off
    if (spinOrder.classList.length === 3 && GameData.CanJoin === false)
    {
        spinOrder.classList.remove("hidden");
    }

    if (GameData.Rotation != localRotation)
    {
        spinOrder.classList.remove(localRotation);
        spinOrder.classList.add(GameData.Rotation);
        localRotation = GameData.Rotation;
    }
}

// HTML RESETS BOARD
function PlayAgain()
{
    document.getElementById("EndMenu").style.visibility = 'hidden';
}

// HTML: Updates Board on variable Change
function UpdateBoard(playerData)
{
    const playerAmount = Object.keys(playerData).length;
    for (let i = 0; i < playerAmount; i++) {
        const cardsNum = Object.values(playerData)[i].CardsLeft;
        const playerid = Object.values(playerData)[i].id;

        if(document.getElementById(playerid+"-playercardamount") != null)
        {
            document.getElementById(playerid+"-playercardamount").innerHTML = cardsNum;
        }
    }
}

// HTML: Sets board when child enters
function SetBoard(gameData) 
{
    const playerAmount = Object.keys(gameData).length;
    var playerNum = 0;
    var hostText = "";

    // Find the playerNum for the current player
    for (let i = 0; i < playerAmount; i++) {
        const currentPlayer = Object.values(gameData)[i];
        if (currentPlayer.id === playerID) {
            playerNum = parseInt(currentPlayer.playerNum);
            break; // Found the current player, exit the loop
        }
    }

    var ID = playerNum - 1;

    // Setting Player Spot
    if (document.getElementById("Player9").children.length < 1)
    {
        const playerSpotRef = document.getElementById("Player9");

        if(playerhost){hostText = "HostText";}
    
        const playerSpot = (`
            <h3 id="`+playerID+`-playerid" class="PlayerName `+hostText+`">`+playerName+`</h3>
            <img id="`+playerID+`-crown" src="./images/crown.png" alt="Host Crown" class="HostCrown hidden"> 
    
            <div class="PlayerStack">
                <img src="./images/CardStack.png" alt="stack" class="Stackimg">
            </div>
    
            <div class="card backOfCard PlayerTopCard">
                <img src="./images/besmot.png" alt="mathuno" class="Cardimg"> 
            </div>
    
            <div class="CardAmount">
                <h3 id="`+playerID+`-playercardamount" class="CardAmountText">0</h3>
            </div>

            <div id="lastCardButton" class="btn hidden" onclick="lastCard()">MATH-<br>UNO!</div>
        `);
    
        playerSpotRef.insertAdjacentHTML('beforeend', playerSpot);
        playerSpotRef.setAttribute("data-player-id", playerID);
    }
    //

    hostText = "";

    if (playerAmount > 1)
    {   
        for (let i = 0; i < playerAmount; i++) {
            const playerName = Object.values(gameData)[i].UserName;
            const playerid = Object.values(gameData)[i].id;
            const playerHost = Object.values(gameData)[i].IsHost;

            if(playerHost)
            {
                hostText = "HostText";
            }
            else{
                hostText = "";
            }

            if (ID != 0)
            {
                if (document.getElementById("Player"+ID).children.length < 1)
                {
                    const playerSpotRef = document.getElementById("Player"+ID);
                    const playerSpot = (`
                        <h3 id="`+playerid+`-playerid" class="PlayerName `+hostText+`">`+playerName+`</h3>
                        <img id="`+playerid+`-crown" src="./images/crown.png" alt="Host Crown" class="HostCrown hidden"> 
    
                        <div class="PlayerStack">
                            <img src="./images/CardStack.png" alt="stack" class="Stackimg">
                        </div>
                
                        <div class="card backOfCard PlayerTopCard">
                            <img src="./images/besmot.png" alt="mathuno" class="Cardimg"> 
                        </div>
                
                        <div class="CardAmount">
                            <h3 id="`+playerid+`-playercardamount" class="CardAmountText">0</h3>
                        </div>
                    `)
                    playerSpotRef.insertAdjacentHTML('beforeend', playerSpot);
                    playerSpotRef.setAttribute("data-player-id", playerid);
                }
                ID -= 1;
                }
            else{
                ID = 8;
            }
        }
    }
}

// HTML: Takes care of the HTML for adding a new card to player cards
async function addNewCard(card)
{
    playerCardNum = String(document.getElementsByClassName("playerCard").length);
    var cardID = card[2];
    const newCard = 
    (`
        <div class="playerCard" data-card-id="`+cardID+`" onclick="selectCard('`+cardID+`')" id="`+cardID+`">
            <div class="card `+card[1]+` selectableCard" id="None">
                <img src="./images/`+card[0]+`.png" alt="mathuno" class="Cardimg">
            </div>
        </div>
    `);
    document.getElementById('playerCards').insertAdjacentHTML('beforeend', newCard);
    const animatedCard = document.getElementById(cardID);
    await playAnimation(animatedCard)

    document.getElementById("playerCards").style = 'grid-template-columns: repeat('+ playerCardNum +', minmax(50px, 1fr));'
}

// HTML: Takes care of HTML when submitting card
function SetTopCardElement(card){

    const discardCard = document.getElementById("DiscardCard");

    const NewCard = 
    (`
        <div>
            <div class="card `+card[1]+`" id="DiscardedCard">
                <img src="./images/`+card[0]+`.png" alt="mathuno" class="Cardimg">
            </div>
        </div>
    `);

    discardCard.innerHTML = NewCard;

    playAnimation(discardCard);
    
    if (card[0] == "Wild" || card[0] == "WildDraw4")
    {
        document.getElementById("ColorMenu").style.visibility = 'visible';
    }
}

// HTML: Adds Draw Amount to Deck
function SetDrawIndicator(drawAmount){
    if (drawAmount > 0)
    {
        document.getElementById("DrawAmountTextDIV").style.visibility = 'visible';
        document.getElementById("DrawAmountText").style.visibility = 'visible';
        document.getElementById("DrawAmountText").innerHTML = String(drawAmount);
    }
    else
    {
        document.getElementById("DrawAmountTextDIV").style.visibility = 'hidden';
        document.getElementById("DrawAmountText").style.visibility = 'hidden';
    }
}

// HTML: Displays End Game Screen
function ShowEndGameScreen(winner)
{
    document.getElementById("DiscardCard").innerHTML = "";
    document.getElementById("playerCards").innerHTML = "";
    document.getElementById("OrderSpin").classList.add("hidden");
    document.getElementById("EndMenu").style.visibility = 'visible';
    document.getElementById("EndGamePlayerName").innerHTML = winner + "<br>WINS!";
}

// HTML: Hides Buttons if its not a wildcard
function HideColorButtons(isWildCard)
{
    const colorButtons = document.getElementById('ColorMenu');
    if (isWildCard) {
        colorButtons.style.visibility = 'visible';
    } else {
        colorButtons.style.visibility = 'hidden';
    }
}

// GENERAL ################################################


// GENERAL: Returns a random number in range
function getRandomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min)
}

// GENERAL: Recognizes when the window loads and adds custom ID
window.addEventListener('DOMContentLoaded', (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    playerGameID = urlParams.get('gameID');
    if (playerGameID) {
        document.getElementById('JoinInput').value = playerGameID;
    }
    
    const localName = localStorage.getItem("playerName");
    if (localName != null)
    {
        document.getElementById("NameInput").innerHTML = localName;
    }
});

// GENERAL: Playes Animation when card is added to pile
function playAnimation(animatedCard)
{
    animatedCard.classList.add("SubmittedCard");

    setTimeout(function() {
        animatedCard.classList.remove("SubmittedCard");
    }, 500);
}

function playNotificationAnimation(color, PlayerUserName, text)
{

    const NotificationElement = (
        `
        <div id="`+ PlayerUserName +`" class="ScreenNotification NotificationAnimation `+color+`">
            `+ PlayerUserName +` - `+text+`
        </div>
        `
    )

    document.getElementById("GameBoard").insertAdjacentHTML('beforeend', NotificationElement);

    setTimeout(function() {
        document.getElementById(PlayerUserName).remove();
    }, 2400);
}

// GENERAL: Gives time for animation when adding new Card
function updateUserDeck(NewCards) {
    return new Promise((resolve, reject) => {
        (function myLoop(i) {
            setTimeout(function() {
                addNewCard(NewCards[i-1]);

                if (--i === 0) {
                    resolve();
                } else {
                    myLoop(i);
                }
            }, 200);
        })(NewCards.length);
    });
}

// GENERAL: Returns random number for game ID
function generateGameID() {
    var randID = ""
    for (let i = 0; i < 6; i++) { 
        randID = randID + String(getRandomNumber(0,9))
    }
    return randID;
}

// GENERAL: Loading Assets and Loading Screen
document.addEventListener("DOMContentLoaded", () => {
    const imageUrls = [
        "./images/besmot.png",
        "./images/Captian-Crunchy.png",
        "./images/CardStack.png",
        "./images/crown.png",
        "./images/devils-playground.png",
        "./images/DiscardCardStack.png",
        "./images/Draw2.png",
        "./images/merchant.png",
        "./images/Mother_Tree.png",
        "./images/Obsidian_Steve.png",
        "./images/Octopus_of_Everlasting_Destruction.png",
        "./images/Pumpkin_King.png",
        "./images/Reverse.png",
        "./images/Skip.png",
        "./images/starch-king.png",
        "./images/talkingStick.png",
        "./images/Terry-Accountant.png",
        "./images/Wild.png",
        "./images/WildDraw4.png"
    ];

    const images = [];
    let imagesLoaded = 0;

    for (const imageUrl of imageUrls) {
        const image = new Image();
        image.src = imageUrl;

        image.onload = () => {
            imagesLoaded++;

            if (imagesLoaded === imageUrls.length) {
                // All images have loaded
                showContent();
            }
        };

        image.onerror = () => {
            // Handle image loading errors here
            console.error("Error loading an image:", image.src);
        };

        images.push(image);
    }

    function showContent() {
        // Hide the loading screen
        const loadingScreen = document.getElementById("loading-screen");
        loadingScreen.style.display = "none";

        // Show the content
        const content = document.getElementById("content");
        content.classList.remove("hidden");
    }
});

/*
const isHost = Object.values(gameData)[i].IsHost;

if (isHost){document.getElementById(playerid+"-playerid").classList.add("HostText");}
else {document.getElementById(playerid+"-playerid").classList.remove("HostText");}

*/