const { default: axios } = require("axios");
const { axiosObservable, getErrorCode, errors } = require("../config/helpers");
const { executesimpletransaction } = require("../config/triggerfunctions");

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
      url: `${process.env.LLAMA3}/create_collection`,
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
      url: `${process.env.LLAMA3}/create_collection_document`,
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
//falta
exports.createCollectionDocuments = async (req, res) => {
  try {
    const { collection, urls } = req.body;
    let responseCollectionDocuments = await axiosObservable({
      data: { collection: collection, urls: urls },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      method: "post",
      url: `${process.env.LLAMA3}/create_collection_documents`,
      _requestid: req._requestid,
    });

    if (responseCollectionDocuments.data && responseCollectionDocuments.statusText === "OK") {
      return res.json({ ...responseCollectionDocuments.data, success: true });
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
      url: `${process.env.LLAMA3}/delete_collection`,
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
      url: `${process.env.LLAMA3}/massive_delete`,
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
      url: `${process.env.LLAMA3}/edit_collection`,
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
      url: `${process.env.LLAMA3}/add_file`,
      _requestid: req._requestid,
    });

    if (responseAddFile.data && responseAddFile.status === 201) {
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
//falta
exports.addFiles = async (req, res) => {
  try {
    const { urls, collection } = req.body;
    let responseAddFiles = await axiosObservable({
      data: { urls: urls, collection: collection },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      method: "post",
      url: `${process.env.LLAMA3}/add_files`,
      _requestid: req._requestid,
    });

    if (responseAddFiles.data && responseAddFiles.status === 201) {
      return res.json(responseAddFiles.data);
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
      url: `${process.env.LLAMA3}/delete_file`,
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
    const { assistant_name, query, system_prompt, model, thread_id, max_new_tokens, temperature, top_p, threadid, repetition_penalty, top_k } = req.body;

    let context = "";
    if (threadid) {
      const resinteraction = await executesimpletransaction("UFN_THREAD_LAST", { threadid });
      if (resinteraction instanceof Array && resinteraction.length > 0) {
        context = resinteraction[0].concatenated_messages;
      }
    }

    let responseQuery = await axiosObservable({
      data: {
        assistant_name: assistant_name,
        query: query,
        system_prompt: system_prompt,
        model: model,
        thread_id: thread_id,
        context: context || " ",
        max_new_tokens: max_new_tokens,
        temperature: temperature,
        top_p: top_p,
        repetition_penalty: repetition_penalty,
        top_k: top_k,
      },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      method: "post",
      url: `${process.env.LLAMA3}/llama3/query`,
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
      url: `${process.env.LLAMA3}/delete_thread`,
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