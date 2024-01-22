const { default: axios } = require("axios");
const { axiosObservable, getErrorCode } = require("../config/helpers");

exports.createThreads = async (req, res) => {
  try {
    const { apikey } = req.body;
    let responseThread = await axios({
      method: "post",
      url: `${process.env.GPT_SERVICES}/threads`,
      data: { apikey: apikey },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      timeout: 600000,
    });

    if (responseThread.data && responseThread.statusText === "OK") {
      return res.json(responseThread.data);
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

exports.deleteThreads = async (req, res) => {
  try {
    const { apikey, thread_id } = req.body;
    let responseDeleteThread = await axios({
      method: "post",
      url: `${process.env.GPT_SERVICES}/threads/delete`,
      data: { apikey: apikey, thread_id: thread_id },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      timeout: 600000,
    });

    if (responseDeleteThread.data && responseDeleteThread.statusText === "OK") {
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

exports.createAssistant = async (req, res) => {
  try {
    const {
      apikey,
      name,
      instructions,
      basemodel,
      retrieval,
      codeinterpreter,
    } = req.body;
    let reponseCreateAssistant = await axios({
      method: "post",
      url: `${process.env.GPT_SERVICES}/assistants/new`,
      data: {
        apikey: apikey,
        name: name,
        instructions: instructions,
        basemodel: basemodel,
        retrieval: retrieval,
        codeinterpreter: codeinterpreter,
      },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      timeout: 600000,
    });

    if (
      reponseCreateAssistant.data &&
      reponseCreateAssistant.statusText === "OK"
    ) {
      return res.json(reponseCreateAssistant.data);
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

exports.updateAssistant = async (req, res) => {
  try {
    const {
      apikey,
      assistant_id,
      name,
      instructions,
      basemodel,
      retrieval,
      codeinterpreter,
      file_ids,
    } = req.body;
    let responseUpdateAssistant = await axios({
      method: "post",
      url: `${process.env.GPT_SERVICES}/assistants/update`,
      data: {
        apikey: apikey,
        assistant_id: assistant_id,
        name: name,
        instructions: instructions,
        basemodel: basemodel,
        retrieval: retrieval,
        codeinterpreter: codeinterpreter,
        file_ids: file_ids,
      },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      timeout: 600000,
    });

    if (
      responseUpdateAssistant.data &&
      responseUpdateAssistant.statusText === "OK"
    ) {
      return res.json(responseUpdateAssistant.data);
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

exports.deleteAssistant = async (req, res) => {
  try {
    const { apikey, assistant_id } = req.body;
    let responseDeleteAssistant = await axios({
      method: "post",
      url: `${process.env.GPT_SERVICES}/assistants/delete`,
      data: {
        apikey: apikey,
        assistant_id: assistant_id,
      },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      timeout: 600000,
    });

    if (
      responseDeleteAssistant.data &&
      responseDeleteAssistant.statusText === "OK"
    ) {
      return res.json(responseDeleteAssistant.data);
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

exports.messages = async (req, res) => {
  try {
    const { text, assistant_id, thread_id, sources, apikey } = req.body;
    let responseMessages = await axios({
      method: "post",
      url: `${process.env.GPT_SERVICES}/assistants/messages`,
      data: {
        text: text,
        assistant_id: assistant_id,
        thread_id: thread_id,
        sources: sources,
        apikey: apikey,
      },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      timeout: 600000,
    });

    if (responseMessages.data && responseMessages.statusText === "OK") {
      return res.json(responseMessages.data);
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
