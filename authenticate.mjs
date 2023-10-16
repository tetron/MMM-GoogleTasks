import { program } from 'commander';

import { google } from 'googleapis';
import readline from 'readline';
import fs from 'fs';

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/tasks.readonly'];

program
  .option('-c, --credential-file <credentialFile>', 'path to credential file', './credentials.json')
  .option('-t, --token-file <tokenFile>', 'path to token file', './token.json')

program.parse(process.argv);
const options = program.opts();

// Load client secrets from a local file.
fs.readFile(options.credentialFile, (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);

  let currentTokens = [];
  if (fs.existsSync(options.tokenFile)) {
    const token = fs.readFileSync(options.tokenFile, "utf-8");
    
    currentTokens = JSON.parse(token);
    currentTokens.forEach(element => {
      console.log(element.account);
    });
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter Account Code: ', (code) => {
    rl.close();
    console.log(`You chose ${code}`);
    // Authorize a client with credentials, then call the Google Slides API.
    authorize(options.tokenFile, JSON.parse(content), currentTokens, code, listTaskLists);
  });


});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(tokenPath, credentials, currentTokens, account, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  const existingToken = currentTokens.find(element => element.account === account);

  if (!existingToken)
  {
    getNewToken(tokenPath, oAuth2Client, currentTokens, account, callback);
  }
  else
  {
    oAuth2Client.setCredentials(existingToken.token);
    callback(oAuth2Client);
  }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(tokenPath, oAuth2Client, currentTokens, account, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  const existingToken = currentTokens.find(element => element.account === account);

  console.log(`Setting Refresh token for account ${account}`);
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log("Error: " + err);
        return callback(err);
      }
      oAuth2Client.setCredentials(token);

      if (existingToken) {
        existingToken.token = token;
      }
      else {
        currentTokens.push({
          account: account,
          token: token
        })
      }

      // Store the token to disk for later program executions
      fs.writeFile(tokenPath, JSON.stringify(currentTokens), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', tokenPath);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the user's first 10 task lists.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listTaskLists(auth) {
  const service = google.tasks({version: 'v1', auth});
  service.tasklists.list({
    maxResults: 10,
  }, (err, res) => {
    if (err) return console.error('The API returned an error: ' + err);
    const taskLists = res.data.items;
    if (taskLists) {
      console.log('Task lists:');
      taskLists.forEach((taskList) => {
        console.log(`${taskList.title} (${taskList.id})`);
      });
    } else {
      console.log('No task lists found.');
    }
  });
}