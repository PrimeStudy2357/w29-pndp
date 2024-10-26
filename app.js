import { io } from 'https://cdn.socket.io/4.8.0/socket.io.esm.min.js';

const socket = io('http://localhost:3000');

let localStream;
let remoteStream;
let peerConnection;

const roomName = 'room';

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const StartButton = document.getElementById('startButton');

// STUN 서버 설정 (Google에서 제공하는 무료 서버)
const iceServer = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302'}],
};

StartButton.addEventListener('click', async() => {
    // 미디어 장치로부터 스트림 가져오기 (카메라&마이크)
    localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
    });
    localVideo.srcObject = localStream;

    // WebRTC API, PeerConnection 생성
    peerConnection = new RTCPeerConnection(iceServer);

    // 두 로컬 스트림 트랙(비디오&오디오)을 PeerConnection에 추가
    localStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, localStream));
    
    // 상대방으로 부터 받은 원격 스트림을 HTML에 매핑
    peerConnection.addEventListener('track', (event) => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    });

    // Offer 생성 및 전송
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer, roomName);

    // Offer를 상대로부터 받을 시 Answer 생성 및 전송
    socket.on('offer', async (offer) => {
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', answer, roomName);
    });

    // Answer를 받았을 때의 처리
    socket.on('answer', (answer) => {
        peerConnection.setRemoteDescription(answer);
    });

    // ICE Candidate 처리
    peerConnection.addEventListener('icecandidate', (event) => {
        socket.emit('ice', event.candidate, roomName);
    });
    socket.on('ice', (ice) => {
        peerConnection.addIceCandidiate(ice);
    });
});