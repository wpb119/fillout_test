require('dotenv').config();
const express = require('express');
const formController = require('./controllers/formController');

const app = express();
app.use(express.json());

// Define route handler for /{formId}/filteredResponses
app.get('/:formId/filteredResponses', formController.getFilteredResponse);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
