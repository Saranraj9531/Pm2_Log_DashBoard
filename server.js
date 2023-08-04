const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const env = dotenv.parsed;

const port = process.env.PORT || 3000;
const filePath1 = process.env.FILE_PATH1;
const filePath2 = process.env.FILE_PATH2;

const fs = require('fs');
const basicAuth = require('express-basic-auth');
const { spawn } = require('child_process');

// Middleware for basic authentication
const auth = basicAuth({
  users: { [env.USERNAME]: env.PASSWORD },
  challenge: true,
  realm: 'Restricted Area',
});

app.get('/pm2-error', auth, (req, res) => {
  readFileContentLastNLines(filePath1, res, 50);
});

app.get('/pm2-nonerror', auth, (req, res) => {
  readFileContentLastNLines(filePath2, res, 50);
});

// Function to read last N lines of file content and send response
function readFileContentLastNLines(filePath, res, n) {
  const tailProcess = spawn('tail', ['-n', n, filePath]);

  tailProcess.stdout.on('data', (data) => {
    res.write(data);
  });

  tailProcess.stderr.on('data', (data) => {
    console.error(`tail process stderr: ${data}`);
    res.status(500).send('Error reading file');
  });

  tailProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`tail process exited with code ${code}`);
      res.status(500).send('Error reading file');
    } else {
      res.end();
    }
  });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Schedule periodic reading of the files
setInterval(() => {
  readFilesPeriodically();
}, 2000); // Read the files every 2 seconds

// Function to read files periodically
function readFilesPeriodically() {
  fs.stat(filePath1, (err, stats) => {
    if (err) {
      console.error(err);
    } else {
      if (stats.size > 0) {
        fs.open(filePath1, 'r', (err, fd) => {
          if (err) {
            console.error(err);
          } else {
            const buffer = Buffer.alloc(1024);
            const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
            const content = buffer.toString('utf8', 0, bytesRead);
            console.log('File content 1:', content);
            // You can perform additional processing or update logic here
            fs.close(fd, (err) => {
              if (err) {
                console.error(err);
              }
            });
          }
        });
      } else {
        console.log('File 1 is empty.');
      }
    }
  });

  fs.stat(filePath2, (err, stats) => {
    if (err) {
      console.error(err);
    } else {
      if (stats.size > 0) {
        fs.open(filePath2, 'r', (err, fd) => {
          if (err) {
            console.error(err);
          } else {
            const buffer = Buffer.alloc(1024);
            const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
            const content = buffer.toString('utf8', 0, bytesRead);
            console.log('File content 2:', content);
            // You can perform additional processing or update logic here
            fs.close(fd, (err) => {
              if (err) {
                console.error(err);
              }
            });
          }
        });
      } else {
        console.log('File 2 is empty.');
      }
    }
  });
}
