const request = require("request");
const sleep = require("sleep");

function doWork() {
  let options = {
    method: "POST",
    url: "http://localhost:5279",
    headers: {
      "Content-Type": "application/json"
    },
    body: { method: "claim_list_mine" },
    json: true
  };

  request(options, async function(error, response, body) {
    if (error) throw new Error(error);

    if (body.hasOwnProperty("error")) {
      console.error(body.error);
    } else {
      let resultSet = body.result;
      let allVideos = [];
      let publishedIDs = {};

      for (let i = 0; i < resultSet.length; i++) {
        let c = resultSet[i];
        try {
          let videoInfo = await processChannel(c);
          allVideos.push(videoInfo);
          if (!publishedIDs.hasOwnProperty(videoInfo.videoID)) {
            publishedIDs[videoInfo.videoID] = videoInfo;
          } else if (
            publishedIDs[videoInfo.videoID].claimID !== videoInfo.claimID
          ) {
            console.error(
              "A video was already published for ID: " +
                videoInfo.videoID +
                "\n previously published video: " +
                JSON.stringify(publishedIDs[videoInfo.videoID], null, 4)
            );
            console.info(
              "Gotta abandon: " + JSON.stringify(videoInfo, null, 4)
            );
            try {
              await abandon(videoInfo.claimID);
            } catch (e) {
              console.error(e);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  });
}
async function processChannel(c) {
  if (
    (c.category !== "claim" && c.category !== "update") ||
    !c.value.hasOwnProperty("stream")
  )
    return Promise.reject(c.category);
  let claimMetadata = c.value.stream.metadata;
  let videoID = claimMetadata.thumbnail.substr(
    claimMetadata.thumbnail.lastIndexOf("/") + 1,
    claimMetadata.thumbnail.length - 1
  );
  let videoInfo = {
    videoID: videoID,
    claimName: c.name,
    claimID: c.claim_id,
    channelName: c.channel_name,
    success: false,
    error: null
  };

  sleep.msleep(50);
  return Promise.resolve(videoInfo);
}

function abandon(claimid) {
  return new Promise((resolve, reject) => {
    let options = {
      method: "POST",
      url: "http://localhost:5279",
      headers: {
        "Content-Type": "application/json"
      },
      body: { method: "claim_abandon", params: { claim_id: claimid } },
      json: true
    };

    request(options, function(error, response, body) {
      if (error) return reject(error);

      console.log(body);
      return resolve(body);
    });
  });
}

doWork();
