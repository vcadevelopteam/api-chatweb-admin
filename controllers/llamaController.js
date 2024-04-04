const { default: axios } = require("axios");
const { axiosObservable, getErrorCode, errors } = require("../config/helpers");

exports.createCollection = async (req, res) => {
  try {
    const { name } = req.body;
    let responseCollection = await axiosObservable({
      data: { name: name },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      method: "post",
      url: `${process.env.LLAMA}/create_collection`,
      _requestid: req._requestid,
    });

    if (responseCollection.data && responseCollection.statusText === "OK") {
      return res.json(responseCollection.data);
    }
    return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
  } catch (exception) {
    return res
      .status(500)
      .json(
        getErrorCode(
          null,
          exception,
          `Request to ${req.originalUrl}`,
          req._requestid
        )
      );
  }
};

exports.addFile = async (req, res) => {
  try {
	const { url, collection } = req.body;
	let responseAddFile = await axiosObservable({
		data: { url: url, collection: collection },
		headers: {
			Authorization: req.headers.authorization,
			"Content-Type": "application/json",
		},
		method: 'post',
		url: `${process.env.LLAMA}/add_file`,
		_requestid: req._requestid,
	});

	if (responseAddFile.data && responseAddFile.statusText === "OK") {
		return res.json(responseAddFile.data);
	}
	return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
  } catch (exception) {
    return res
      .status(500)
      .json(
        getErrorCode(
          null,
          exception,
          `Request to ${req.originalUrl}`,
          req._requestid
        )
      );
  }
};

exports.query = async (req, res) => {
	try {
	  const { collection, query, prompt, chat_history } = req.body;
	  let responseQuery = await axiosObservable({
		  data: { collection: collection, query: query, prompt: prompt, chat_history: chat_history },
		  headers: {
			  Authorization: req.headers.authorization,
			  "Content-Type": "application/json",
		  },
		  method: 'post',
		  url: `${process.env.LLAMA}/query`,
		  _requestid: req._requestid,
	  });
  
	  if (responseQuery.data && responseQuery.statusText === "OK") {
		  return res.json(responseQuery.data);
	  }
	  return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
	} catch (exception) {
	  return res
		.status(500)
		.json(
		  getErrorCode(
			null,
			exception,
			`Request to ${req.originalUrl}`,
			req._requestid
		  )
		);
	}
  };

  exports.deleteCollection = async (req, res) => {
	try {
	  const { name } = req.body;
	  let responseDeleteCollection = await axiosObservable({
		data: { name: name },
		headers: {
		  Authorization: req.headers.authorization,
		  "Content-Type": "application/json",
		},
		method: "delete",
		url: `${process.env.LLAMA}/delete_collection`,
		_requestid: req._requestid,
	  });
  
	  if (responseDeleteCollection.data && responseDeleteCollection.statusText === "OK") {
		return res.json(responseDeleteCollection.data);
	  }
	  return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
	} catch (exception) {
	  return res
		.status(500)
		.json(
		  getErrorCode(
			null,
			exception,
			`Request to ${req.originalUrl}`,
			req._requestid
		  )
		);
	}
  };