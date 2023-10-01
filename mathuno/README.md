# Overview

The goal of this project was to create a mutliplayer game online that used a cloud firebase.
I also wanted to challenge myself by not using any tutorials and figuring it out on my own. 
I did use a couple tutorials for general material, but there wasn't a specific uno tutorial that I followed.

The software that I wrote is a uno game called mathuno. If you would like to play a live version of it go to 
https://onlinemultiplayergame.web.app/

I made this software to learn how to make a multiplayer game. Its purpose is to provide entertainment to users.

[Software Demo Video](https://www.youtube.com/watch?v=qiWE_Bt5VTU)

# Cloud Database

For this project I used Firebase as my cloud database. Inside of this database are two tables.
1. GameData: This table holds generic data that is applicable for each player
2. Players: This table holds data that is specific to each user and is rarely accessed by other users.

# Development Environment

I used javascript, html, and css for this project. I didn't use any libraries other than firebase.

# Useful Websites

All the code provided was my own. I didn't use any tutorials. I did get a little help from W3Schools, online forms, and ChatGPT when I got stuck. 

Other than that this project was all me trying to figure out how to solve each problem on my own.
# Future Work

The following is my current update list:
Fix bar not turning green at beginning of round for first player.

•	If you draw and can play then let the user play

•	End game screen player text is too big

•	add uno button

•	didn’t update green square on player leave because last player wasn’t updated.

•	Arrow showing direction of play

•	If its your turn show who is going to be next by highlighting them yellow

•	Host shows 0 cards left after reset

•	Spamming clicking on your own cards can get you out of a draw 2. Only if you are the host.

•	Too many cards being added for players

•	Show crown on player who won on their screen somewhere

•	Give player their own card spot so they can have a crown 🙄

•	Make Host on different section of login popup

•	Don’t let player spam join

•	Let the player see the last card placed
