// ==UserScript==
// @name         Reputation Revealer
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  try to take over the world!
// @author       Jeveux
// @match        http://forum.pandawow.ru/usercp.php
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Verschnittene/PandaWoW/master/ForumKit/extendedReputation.js
// @downloadURL  https://raw.githubusercontent.com/Verschnittene/PandaWoW/master/ForumKit/extendedReputation.js
// ==/UserScript==

(function() {
    'use strict';

function fetchElementForSelector(url, selector) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest()
        xhr.open('GET', url, true)

        xhr.onload = function() {
            if (this.status == 200) {
                var p = new DOMParser()
                resolve(p.parseFromString(this.response, 'text/html').querySelector(selector))
            } else {
                var error = new Error(this.statusText)
                error.code = this.status
                reject(error)
            }
        }

        xhr.onerror = function() {
            reject(new Error("Network Error"))
        }

        xhr.send()
    })
}

function appendReputationDetails(record) {
    Promise.all([
        fetchElementForSelector(`member.php?u=${record.userID}`, 'title'),
        fetchElementForSelector(record.postLink, `#post_message_${record.postID}`)
    ]).then(results => {
        var userName = parseUserNameFromDOMTitle(results[0])
        record.commentBlock.innerHTML += ` @<a class="smallfont" href="member.php?u=${record.userID}">${userName}</a>
                                           <a class="smallfont" href="${record.postLink}">(post#${record.postID})</a>`

        var messageContent = results[1]
        messageContent.setAttribute('class', 'reputationRecordMessage')
        record.commentBlock.appendChild(messageContent)
    }).catch(error => {
        alert(`Error ${error.code} received`)
    })
}

var styleForReputationRecordDetails = document.createElement('style')
styleForReputationRecordDetails.innerHTML =
    `.reputationRecordMessage {     
        margin: 10px 0px 10px 0px;
        padding: 10px;
        border: solid 1px #5a7f97;
        border-radius: 5px;
        background: #f5f5f5;
        font-size: 13px;
    }

    .reputationRecordMessage img:not(.inlineimg, [alt="Цитата"]) {
        width: 100%;
        height: 100%;
    }`

document.head.appendChild(styleForReputationRecordDetails)

var reputationList = document.querySelectorAll('#reputationlist > li')
for (var i = 0; i < reputationList.length; i++) {
    var record = parseReputationRecordMeta(reputationList[i])
    appendReputationDetails(record)
}

// MARK: - Parsing functions

function parseReputationRecordMeta(recordListElement) {
    var id = recordListElement.getAttribute('id').match(/\d+/g)

    return {
        postID: id[0],
        userID: id[1],
        postLink: recordListElement.getElementsByClassName('smallfont')[0].getAttribute('href'),
        commentBlock: recordListElement.getElementsByClassName('comment')[0]
    }
}

function parseUserNameFromDOMTitle(titleElement) {
    var userNamePattern = /:\s.+(?=\s-)/
    return titleElement.innerText.match(userNamePattern)[0].replace(': ', '')
}
})();