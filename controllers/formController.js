const axios = require('axios');

const getFilteredResponse = async (req, res) => {
  try {
    const { formId } = req.params;
    const query = req.query;

    const limit = query.limit || process.env.DEFAULT_LIMIT || 150;
    const offset = query.offset || 0;
    const filters = JSON.parse(query.filters) || [];

    const data = await getAllData(formId, req.query);

    const filterd = data.filter(item => isItemMeetCondition(item, filters));
    const responses = filterd.slice(offset, limit);
    const totalResponses = filterd.length;
    const pageCount = Math.ceil(totalResponses / limit);

    res.json({ responses, totalResponses, pageCount });
  } catch(err) {
    res.status(500).send(err.message);
  }
}

const getData = async (formId, query, offset = 0) => {
  const apiUrl = `${process.env.API_URL}/v1/api/forms/${formId}/submissions`;
  const params = {
    offset,
    ...query
  }
  const headers = {
    Authorization: `Bearer ${process.env.API_KEY}`
  }
  const res = await axios.get(apiUrl, { params, headers });
  return res.data;
}

const getAllData = async (formId, query) => {
  delete query.offset;
  delete query.limit;
  delete query.filters;
  
  const initialData = await getData(formId, query);
  let result = initialData.responses

  const promises = [];
  for (let i = 1; i < initialData.pageCount; i++) {
    const limit = process.env.DEFAULT_LIMIT || 150;
    const newPromise = getData(formId, query, i * limit);
    promises.push(newPromise);
  }

  const data = await Promise.all(promises);
  data.forEach(item => result = result.concat(item.responses));

  return result;
}

const getValidData = (value) => {
  if (!isNaN(value))  // check if the value is number
    return value;

  const parsedDate = new Date(value);
  return isNaN(parsedDate.getTime()) ? value : parsedDate;
}

const isItemMeetCondition = (item, filters) => {
  const hash = {};
  item.questions.forEach(question => hash[question.id] = getValidData(question.value))

  for (let i = 0 ; i < filters.length; i++) {
    let { id, condition, value } = filters[i];

    if (hash.hasOwnProperty(id) == false)
      return false;

    value = getValidData(value);

    switch(condition) {
      case 'equals':
        if (hash[id] != value)
          return false;
        break;
      case 'does_not_equal':
        if (hash[id] == value)
          return false;
        break;
      case 'greater_than':
        if (hash[id] <= value)
          return false;
        break;
      case 'less_than':
        if (hash[id] >= value)
          return false;
        break;
      default:
        throw new Error('Invalid condition type: ' + condition);
    }
  }
  return true;
}

module.exports = {
  getFilteredResponse
}