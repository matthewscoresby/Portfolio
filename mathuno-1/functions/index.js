const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.clearGameData = functions.database
  .ref('{gameId}/players')
  .onDelete(async (snapshot, context) => {
    const gameId = context.params.gameId;

    if (!snapshot.exists()) {
      await admin.database().ref(`games/${gameId}`).remove();
    }
  });