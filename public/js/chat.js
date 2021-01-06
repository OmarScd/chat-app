const socket = io();

// elements
const $messageForm = document.getElementById('message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.getElementById('send-location');
const $messages = document.getElementById('messages');
const $sidebar = document.getElementById('sidebar');

// templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const locationTemplate = document.getElementById('location-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

// options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
  // new message element
  const $newMessage = $messages.lastElementChild;

  // height of the new message
  const newMessageStyles =  getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // visible height
  const visibleHeight = $messages.offsetHeight;

  // height of messages container
  const containerHeight = $messages.scrollHeight;

  // how far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: dayjs(message.createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', (message) => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: dayjs(message.createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', (event) => {
  event.preventDefault();

  $messageFormButton.setAttribute('disabled', 'disabled');
  const message = event.target.elements.message.value

  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();
    
    if (error) {
      return console.log(error);
    }
    console.log('Message delivered');
  });
});

$sendLocationButton.addEventListener('click', (event) => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported on you browser :(');
  }
  
  event.target.setAttribute('disabled', 'disabled');
  
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      lat: position.coords.latitude,
      long: position.coords.longitude,
    }, () => {
      event.target.removeAttribute('disabled');
    });
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
