const { default: axios } = require("axios");
const { axiosObservable, getErrorCode, errors } = require("../config/helpers");

exports.createCollection = async (req, res) => {
  try {
    const { collection } = req.body;
    let responseCollection = await axiosObservable({
      data: { collection: collection },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      method: "post",
      url: `${process.env.LLAMA}/create_collection`,
      _requestid: req._requestid,
    });

    if (responseCollection.data && responseCollection.statusText === "OK") {
      return res.json({ ...responseCollection.data, success: true });
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

exports.createCollectionDocument = async (req, res) => {
  try {
    const { collection, url } = req.body;
    let responseCollectionDocument = await axiosObservable({
      data: { collection: collection, url: url },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      method: "post",
      url: `${process.env.LLAMA}/create_collection_document`,
      _requestid: req._requestid,
    });

    if (responseCollectionDocument.data && responseCollectionDocument.statusText === "OK") {
      return res.json({ ...responseCollectionDocument.data, success: true });
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
      method: "post",
      url: `${process.env.LLAMA}/delete_collection`,
      _requestid: req._requestid,
    });

    if (
      responseDeleteCollection.data &&
      responseDeleteCollection.statusText === "OK"
    ) {
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

exports.massiveDeleteCollection = async (req, res) => {
  try {
    const { names } = req.body;
    let responseMassiveDeleteCollection = await axiosObservable({
      data: { names: names },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      method: "post",
      url: `${process.env.LLAMA}/massive_delete`,
      _requestid: req._requestid,
    });

    if (
      responseMassiveDeleteCollection.data &&
      responseMassiveDeleteCollection.statusText === "OK"
    ) {
      return res.json(responseMassiveDeleteCollection.data);
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

exports.editCollection = async (req, res) => {
  try {
    const { name, new_name } = req.body;
    let responseEditCollection = await axiosObservable({
      data: { name: name, new_name: new_name },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      method: "post",
      url: `${process.env.LLAMA}/edit_collection`,
      _requestid: req._requestid,
    });

    if (
      responseEditCollection.data &&
      responseEditCollection.statusText === "OK"
    ) {
      return res.json(responseEditCollection.data);
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
      method: "post",
      url: `${process.env.LLAMA}/add_file`,
      _requestid: req._requestid,
    });

    if (responseAddFile.data && responseAddFile.statusText === "CREATED") {
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

exports.deleteFile = async (req, res) => {
  try {
    const { filename, collection } = req.body;
    let responseDeleteFile = await axiosObservable({
      data: { filename: filename, collection: collection },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      method: "post",
      url: `${process.env.LLAMA}/delete_file`,
      _requestid: req._requestid,
    });

    if (responseDeleteFile.data && responseDeleteFile.statusText === "OK") {
      return res.json(responseDeleteFile.data);
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
    const { collection, query, system_prompt, model, threadid } = req.body;
    let responseQuery = await axiosObservable({
      data: {
        collection: collection,
        query: query,
        system_prompt: system_prompt,
        model: model,
        threadid: threadid
      },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      method: "post",
      url: `${process.env.LLAMA}/query`,
      _requestid: req._requestid,
    });

    if (responseQuery.data && responseQuery.statusText === "OK") {
      return res.json({ data: responseQuery.data });
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

exports.deleteThread = async (req, res) => {
  try {
    const { threadid } = req.body;
    let responseDeleteThread = await axiosObservable({
      data: { threadid: threadid },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      method: "post",
      url: `${process.env.LLAMA}/delete_thread`,
      _requestid: req._requestid,
    });

    if (
      responseDeleteThread.data &&
      responseDeleteThread.statusText === "OK"
    ) {
      return res.json(responseDeleteThread.data);
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