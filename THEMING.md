# Theme template for WAFRN

## Small rickroll detector

Add this to detect rickrolls

```css
a[href*="dQw4w9WgXcQ"]::before {
  content: "this is a rickroll → ";
  color: red;
  background-color: white;
  border-radius: 5px;
  padding: 2px;
}
```

### Initial template made by [@vegeta@app.wafrn.net](https://app.wafrn.net/blog/vegeta)

This is a theme that adds colored boxes arround everything so you can see what youre touching

````
/* !!!!!!! this first bit puts boxes around everything so you can see what you're clicking on when you're inspecting elements. it is turned off by default but it might help you get your bearings maybe !!!!!!!

* {
 border-radius:0px !IMPORTANT;
 border-width:1px;
 border-color:limegreen;
 border-style:dotted;
}

*/

/* FONT OVERRIDE (keep or change if u like it, remove for default fonts) + no rounded corners anywhere */

* {
font-family: Roboto, sans-serif !important;
font-feature-settings: normal !important;
border-radius:0px !important;
}


/* VARIABLES */

:root {
  /* ELEMENT VARIABLES */

  --main-bgcolor: maroon;

  --main-textcolor: white;

  --container-bordercolor: black;

  --link-textcolor: yellow;

  --link-textcolor-hover: violet;

  --link-textcolor-visited: limegreen;

  --button-bgcolor: skyblue;

  --button-bgcolor-hover: powderblue;

  --button-accent-color: red;

  --button-accent-color-hover: hotpink;

  --element-bgcolor: midnightblue;

  --username-textcolor: orange;

  --username-textcolor-hover: white;

  --url-textcolor: cyan;

  --popup-textcolor: black;

  --popup-bgcolor: white;

  --color-trans: 0.37s cubic-bezier(0.77, 0, 0.23, 1);

  --image-transoff: 0.37s cubic-bezier(0.88, 0.52, 0.48, 1);

  --image-trans: 0.37s cubic-bezier(0.81, -0.19, 0.27, 0.34);

  --mat-sys-outline: limegreen;
  /* ^ this changes the color of the timestamp text/associated icon on posts*/

  --mat-badge-background-color: cyan;
  --mat-badge-text-color: black;
  /* ^ these two change your "notifications" number indicator */

  --mat-mdc-tooltip-trigger: black;
   /* ^ idk what this is */
}

.mdc-button__label {
color: var(--button-accent-color);
}

/* DASHBOARD BACKGROUND */

.mat-drawer-content {
  background-color: var(--main-bgcolor) !important;
}
/* ^ you can put an image here [and a lot of other places] with background-image: url('url.webp');. use a link to a file you have uploaded directly to wafrn*/


/* SIDE MENU */

.instance-logo {
        content: url('https://cdn.wafrn.net/api/cache/?media=https%3A%2F%2Fmedia.wafrn.net%2F1744521263201_d70c7598612dfe44bc84463de9ce6c4900c3c390_processed.webp');
    }
/* ^ use a wafrn upload link here too */

.mat-drawer-inner-container {
background-color:black;
}
mat-nav-list {
background-color:black;
}
/* ^ side menu container and buttons [respectively]. idk what the rest below do just leave them off or keep digging*/

/*

mat-drawer.side-menu {}

img[alt="instance logo"] {}

mat-drawer.side-menu hr {}

mat-nav-list {}

mat-nav-list app-menu-item {}

*/

/* BUTTONS - these may be overwritten by the class of the button, see below */

button {
  background: var(--element-bgcolor);
  color: var(--main-textcolor);
  border-color: var(--button-accent-color);
  border-style: solid;
  border-width: 0px;
  border-radius: 0px;
  transition: var(--color-trans);
}

button:hover {
  background: var(--element-bgcolor);
  color: var(--button-accent-color);
  border-color: var(--button-accent-color-hover);
  border-style: dotted;
  border-width: 0px;
  border-radius: 0px;
  transition: var(--color-trans);
}

button:active {
  background: var(--element-bgcolor);
  color: var(--button-accent-color);
  border-color: var(--button-accent-color-hover);
  border-style: dashed;
  border-width: 0px;
  border-radius: 0px;
  transition: var(--color-trans);
}

/* BUTTONS - use these i think */

.mat-mdc-unelevated-button.mat-primary {
  background-color: var(--button-bgcolor) !important;
  border-color: var(--button-accent-color);
  border-width: 2px;
  color: var(--main-textcolor);
  transition: var(--color-trans);
}

.mat-mdc-unelevated-button.mat-primary:hover {
  background-color: var(--button-bgcolor-hover) !important;
  border-color: var(--button-accent-color-hover);
  color: var(--main-textcolor);
  border-width: 0px;
  transition: var(--color-trans);
}

.mat-mdc-unelevated-button {
  background-color: var(--button-bgcolor) !important;
  border-color: var(--button-accent-color);
  border-width: 0px;
  color: var(--main-textcolor);
  transition: var(--color-trans);
}

.mat-mdc-unelevated-button:hover {
  background-color: var(--button-bgcolor-hover) !important;
  border-color: var(--button-accent-color-hover);
  color: var(--main-textcolor);
  border-width: 0px;
  transition: var(--color-trans);
}

/* ^ ALT TEXT / SENSITIVE MEDIA / NOTES ETC COLOR */

/* UNIVERSAL WAFRN CONTAINER */
.wafrn-container {
  background-color: var(--element-bgcolor) !important;
  color: var(--main-textcolor);
  border-radius: 0px;
  border-width: 0px;
  border-style: solid;
  border-color: var(--container-bordercolor);
  box-shadow: none;
}

/* POPUP TOOLTIPS */

.mdc-tooltip__surface {
  background-color: var(--popup-bgcolor) !important;

  color: var(--popup-textcolor) !important;

  border-radius: 2px;
}

/* POSTS */

/* POST CONTAINER */

.mat-mdc-card {
  color: var(--main-textcolor);

  border-radius: 2px;

  border-color: var(--button-accent-color);

  box-shadow: none;
}

/* POST TEXT */

div.wafrn-text-default {
  color: var(--main-textcolor);

  font-family: Georgia, serif;
}

/* LINK TEXT */

a {
  color: var(--link-textcolor);
  transition: var(--color-trans);
}

a:visited {
  color: var(--link-textcolor-visited);
}

a:hover {
  color: var(--link-textcolor-hover);
  transition: var(--color-trans);
}

a:active {
  color: var(--link-textcolor-hover);
}


/* DIVIDER LINE */

app-post hr {
  border-color: var(--button-bgcolor) !important;
  border-width: 2px;
}

/* POST DATE - you can use these i think but use mat-sys-outline at the top to change both at once*/

/*

div.date-line {}

svg.fa-globe {}

*/

/* POSTER INFO */

.original-poster-name {
  color: var(--username-textcolor) !important;

  transition: var(--color-trans);
}

.original-poster-name:hover {
  color: var(--username-textcolor-hover) !important;

  transition: var(--color-trans);
}

.original-poster-url {
  color: var(--url-textcolor);

  font-family: monospace;
}

.avatar {
  height: 45px;

  width: 45px;
}

.avatar img {
  border-radius: 3px;

  height: 45px;

  width: 45px;
}

.user-name {
  color: var(--username-textcolor) !important;

  transition: var(--color-trans);
}

.user-name:hover {
  color: var(--username-textcolor-hover) !important;

  transition: var(--color-trans);
}

span.user-url {
  color: var(--url-textcolor);

  font-family: monospace;
}

/* FOLLOW BUTTON */

button.follow-button {
  background: none !important;

  color: #69f0ae !important;

  border: none !important;

  transition: var(--color-trans);
}

button.follow-button:hover {
  background: none !important;

  color: var(--link-textcolor-hover) !important;

  border: none !important;

  transition: var(--color-trans);
}

/* CONTENT WARNING */

#fragment-content-warning {
  color: var(--main-textcolor);
  background-color: var(--main-bgcolor);
  font-family: monospace;
}

div.fragment-content-warning div.fragment-content {
background-color: var(--main-bgcolor);
}

div.fragment-content-warning button {
background-color: var(--element-bgcolor);
border-color: var(--link-textcolor-visited);
}


/* REACTS */

/* i have the backgrounds on all these set transparent. they can be a little finicky. button settings change these */

#emoji-reactions {
  background:none !important;
  box-shadow:none !important;
  border-width: 0px !important;

  transition: var(--color-trans);
}

#emoji-reactions button:hover {
  background:none !important;
   box-shadow:none !important;
  transition: var(--color-trans);
}

#emoji-reactions .mat-mdc-tooltip-trigger {
background: none !important;
box-shadow:none !important;
border-radius:0px;
}

#emoji-reactions .mat-mdc-tooltip-trigger:hover {
background: none !important;
 box-shadow:none !important;
border-radius:0px;
}

.mat-mdc-raised-button:not(:disabled) {
  background:none !important;
  box-shadow:none !important;
}

/* ^ this is for the stubborn ones */

.mat-mdc-button-persistent-ripple {
  color: black !important;
  box-shadow:none !important;
background:none;
}

/* ^ ??? */

app-emoji-react svg {
  fill: var(--link-textcolor);
  background: none !important;
  transition: var(--color-trans);
}

app-emoji-react svg:hover {
  fill: var(--link-textcolor-hover);
  background: none !important;
  transition: var(--color-trans);
}

/* ^ these two change the color of the emoji react button itself, like the smiley with the plus */

/*

div.emojireact-overlay {}

*/

/* TAGS */

a.tag {
  background-color: var(--element-bgcolor) !important;

  color: var(--link-textcolor) !important;

  transition: var(--color-trans);

  font-family: monospace;
}

a.tag:hover {
  color: var(--link-textcolor-hover) !important;

  transition: var(--color-trans);
}

.ql-snow a {
  color: white;
}

/* ^ changes inline bsky etc. tags*/


/* MENTIONS */

a.mention {
  color: black !important;
  transition: var(--color-trans);
}

a.mention:hover {
  color: red !important;
  transition: var(--color-trans);
}

.mention {
background-color: hotpink !important;
border-width: 0px !important;
border-radius: 0px !important;
}

/* container of quoted post */

div.quoted-post {
  border-width: 0px;
  background:none;
  border-color: var(--button-accent-color);
  border-style: dotted;
  box-shadow: none;
}

/* EMBED CONTAINER */

.embed-container {
background: rgba(255,255,255, 1);
display:inline;
}

/* ^ INLINE STACKS PICTURE ON TOP OF LINK TEXT */

.embed-link {
background: #CBD0F9;
background: linear-gradient(0deg,rgba(203, 208, 249, 1) 0%, rgba(134, 145, 242, 1) 50%, rgba(91, 97, 162, 1) 100%);
border-style:groove;
border-width:2px;
border-color:black;
border:radius:0px;
}

.embed-text {
background-color:white;
border-style:groove;
border-width:2px;
border-color:black;
border:radius:0px;
}

.embed-title, .embed-description, .embed-link, .embed-url {
color:black !important;
}

/* MEDIA CONTAINER */

.media-content-container {
background-color: var(--button-bgcolor) !important;
}

.media-container {
background-color: var(--button-bgcolor) !important;
border-style:groove;
border-width:0px;
border-radius:0px;
border-color:black;
display: grid;
}

.media-gallery, .media-carousel {
background-color: var(--main-bgcolor) !important;
border-radius:0px;
margin-left: auto;
margin-right: auto;
}

/* IMAGES */

app-wafrn-media img {
  filter: brightness(0.7);
  transition: var(--image-transoff);
}

app-wafrn-media img:hover {
  filter: brightness(1);
  transition: var(--image-trans);
}

/* MEDIA DESCRIPTION */

app-wafrn-media div.media-description {
  background-color: var(--element-bgcolor) !important;
  border-radius: 0px;
  font-family: monospace;
  font-size: 11px;
}

/* VOTING [lol] */

/*

.mdc-linear-progress__bar-inner {}
.mdc-linear-progress__buffer-bar {}

*/


/* POST SHARE */

app-post-actions button:hover {
  background: none !important;
  border-width: 0px;
}

svg.fa-share-nodes {
  color: var(--button-accent-color);
  transition: var(--color-trans);
}

svg.fa-share-nodes:hover {
  color: var(--button-accent-color-hover);
  transition: var(--color-trans);
}

svg.fa-chevron-down {
  color: var(--button-accent-color);
  transition: var(--color-trans);
}

svg.fa-chevron-down:hover {
  color: var(--button-accent-color-hover);
  transition: var(--color-trans);
}

/* SHARE DROPDOWN */

.mat-mdc-menu-panel {
  color: var(--link-textcolor);
  background-color: var(--main-bgcolor);
  box-shadow: none !important;
}

/* POST ACTIONS [??] */

/*

app-post hr > div a {}

app-post hr > div a:hover {}

*/

/* USE THIS TO CHANGE ALL FA-ICONS AT ONCE, individual settings below for post options. turned off by default and i dont know the rest of them */

fa-icon {
  color: mediumvioletred;
  transition: var(--color-trans);
}

fa-icon:hover {
  color: white;
  transition: var(--color-trans);
}

/*

fa-icon[mattooltip="Quote woot"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Quote woot"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Quick rewoot"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Quick rewoot"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Delete rewoot"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Delete rewoot"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Reply woot"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Reply woot"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Like woot"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Like woot"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Remove like"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Remove like"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Delete woot"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Delete woot"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

*\

/* TEXT EDITOR */

.mat-mdc-dialog-container, .mdc-dialog--open, .mat-mdc-dialog-inner-container, .mdc-dialog--open, .mat-mdc-dialog-surface {
background-color: var(--main-bgcolor) !important;
border-radius:0px !important;
}
.mat-mdc-dialog-container {
background-color: var(--element-bgcolor);
border-width:4px;
border-radius:0px;
border-style: groove;
border-color:black;
}

/* ^ container box */

.mdc-floating-label {
color:white !important;
}
.mdc-text-field {
background-color: navy;
border-color: white !important;
border-radius: 0px !important;
}

/* ^ typing field */


/* PROFILE */

/*

app-view-blog mat-card.wafrn-container {}

app-view-blog img[alt="user avatar"] {}

*/

/* UNFOLLOW BUTTON */

.mat-mdc-unelevated-button.mat-warn {
  color: var(--main-textcolor);

  background-color: #f44336;

  transition: var(--color-trans);
}

.mat-mdc-unelevated-button.mat-warn:hover {
  background-color: #f44336;

  transition: var(--color-trans);
}

/* FOLLOW COUNT */

/*

div.follow-counts {}

*/

/*EXTRA STUFF*/

code {
  display: inline;
  padding: 0 .2em;
  background-color: white;
  color: black;
  border-style:groove;
  border-width:2px;
  border-color:black;border:radius:0px;
}

pre {
  display: inline;
  padding: 0 .2em;
  background-color: white;
  color: black;
  border-style:groove;
  border-width:2px;
  border-color:black;border:radius:0px;
}


/*^ markdown stuff */


/* LOADING - not quite sure this works */

mat-spinner {
  width: 42px;

  height: 42px;
}

circle {
  color: var(--button-accent-color) !important;

  stroke-dasharray: 77px;

  stroke-width: 33px;
}

p#if-you-see-this-load-more-posts {
  color: var(--main-textcolor);
}

.mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-floating-label {
color: white !important;
}
.mdc-text-field--filled:not(.mdc-text-field--disabled) {
background-color: navy !important;
border-color: white !important;
border-radius: 0px !important;
}

/* ^ changes the theme editor */
```


### Initial template made by [@fizzyday@app.wafrn.net](https://app.wafrn.net/blog/fizzyday)

Here is a theming template you can use to customize the appearance of your profile and how the dashboard appears to you.

It is not complete, nor perfect, but the most important elements are there, have fun playing with it :)

Watch out for when you copy the CSS into wafrn, it changes the double-space indentations to single spaces, you may have to correct that manually for it to work.

Feel free to leave any improvement as a PR, or any issue in the issues section

```css
/* VARIABLES */

:root {
  /* ELEMENT VARIABLES */

  --main-bgcolor: #212121;

  --main-textcolor: white;

  --container-bordercolor: none;

  --link-textcolor: #38fef1;

  --link-textcolor-hover: #38fef1;

  --link-textcolor-visited: #38fef1;

  --button-bgcolor: #424242;

  --button-bgcolor-hover: #424242;

  --button-accent-color: #69f0ae;

  --button-accent-color-hover: #69f0ae;

  --element-bgcolor: #424242;

  --username-textcolor: #38fef1;

  --username-textcolor-hover: #38fef1;

  --url-textcolor: #38fef1;

  --popup-textcolor: white;

  --popup-bgcolor: #424242;

  --color-trans: 0.37s cubic-bezier(0.77, 0, 0.23, 1);

  --image-transoff: 0.37s cubic-bezier(0.88, 0.52, 0.48, 1);

  --image-trans: 0.37s cubic-bezier(0.81, -0.19, 0.27, 0.34);
}

/* BACKGROUND */

.mat-drawer-content {
  background-color: var(--main-bgcolor) !important;
}

/* LINKS */

a {
  color: var(--link-textcolor);

  transition: var(--color-trans);
}

a:visited {
  color: var(--link-textcolor-visited);
}

a:hover {
  color: var(--link-textcolor-hover);

  transition: var(--color-trans);
}

a:active {
  color: var(--link-textcolor-hover);
}

/* BUTTONS - these may be overwritten by the class of the button, see below */

button {
  background-color: var(--button-bgcolor);

  color: var(--main-textcolor);

  border-color: var(--button-accent-color);

  border-style: solid;

  border-width: 0px;

  border-radius: 3px;

  color: var(--main-textcolor);

  transition: var(--color-trans);
}

button:hover {
  background-color: var(--button-bgcolor-hover);

  color: var(button-accent-color);

  border-color: var(--button-accent-color-hover);

  border-style: solid;

  border-width: 0px;

  border-radius: 3px;

  color: var(--main-textcolor);

  transition: var(--color-trans);
}

button:active {
  background-color: var(--button-bgcolor-hover);

  color: var(button-accent-color);

  border-color: var(--button-accent-color-hover);

  border-style: solid;

  border-width: 0px;

  border-radius: 3px;

  color: var(--main-textcolor);

  transition: var(--color-trans);
}

/* SIDE MENU */

/*

mat-drawer.side-menu {}

img[alt="instance logo"] {}

mat-drawer.side-menu hr {}

mat-nav-list {}

mat-nav-list app-menu-item {}

*/

/* DASHBOARD TITLE */

div.wafrn-container.mx-1 {
  display: none;

  background-color: var(--main-bgcolor);
}

div.wafrn-container.mx-1 h3 {
  display: none;

  font-family: sans-serif;
}

/* BUTTONS - use these i think */

.mat-mdc-unelevated-button.mat-primary {
  background-color: var(--button-bgcolor);

  border-color: var(--button-accent-color);

  border-width: 0px;

  color: var(--main-textcolor);

  transition: var(--color-trans);
}

.mat-mdc-unelevated-button.mat-primary:hover {
  background-color: var(--button-bgcolor-hover);

  border-color: var(--button-accent-color-hover);

  color: var(--main-textcolor);

  border-width: 0px;

  transition: var(--color-trans);
}

.mat-mdc-unelevated-button {
  background-color: var(--button-bgcolor);

  border-color: var(--button-accent-color);

  border-width: 0px;

  color: var(--main-textcolor);

  transition: var(--color-trans);
}

.mat-mdc-unelevated-button:hover {
  background-color: var(--button-bgcolor-hover);

  border-color: var(--button-accent-color-hover);

  color: var(--main-textcolor);

  border-width: 0px;

  transition: var(--color-trans);
}

button[aria-label="Go back to the dashboard"] {
  background-color: var(--button-bgcolor);

  border-color: var(--button-accent-color);

  color: var(--main-textcolor);

  transition: var(--color-trans);
}

button[aria-label="Go back to the dashboard"]:hover {
  background-color: var(--button-bgcolor-hover);

  border-color: var(--button-accent-color-hover);

  color: var(--main-textcolor);

  transition: var(--color-trans);
}

/* LOADING - not quite sure this works */

mat-spinner {
  width: 42px;

  height: 42px;
}

circle {
  color: #8531a9 !important;

  stroke-dasharray: 77px;

  stroke-width: 33px;
}

p#if-you-see-this-load-more-posts {
  color: var(--main-textcolor);
}

/* POPUP TOOLTIPS */

.mdc-tooltip__surface {
  background-color: var(--popup-bgcolor) !important;

  color: var(--popup-textcolor) !important;

  border-radius: 2px;
}

/* UNIVERSAL WAFRN CONTAINER */

.wafrn-container {
  background-color: var(--element-bgcolor) !important;

  color: var(--main-textcolor);

  border-radius: 0px;

  border-width: 0px;

  border-style: solid;

  border-color: var(--container-bordercolor);

  box-shadow: none;
}

/* PROFILE */

/*

app-view-blog mat-card.wafrn-container {}

app-view-blog img[alt="user avatar"] {}

*/

/* UNFOLLOW BUTTON */

.mat-mdc-unelevated-button.mat-warn {
  color: var(--main-textcolor);

  background-color: #f44336;

  transition: var(--color-trans);
}

.mat-mdc-unelevated-button.mat-warn:hover {
  background-color: #f44336;

  transition: var(--color-trans);
}

/* FOLLOW COUNT */

/*

div.follow-counts {}

*/

/* TEXT EDITOR */

.ql-snow > .ql-editor {
  background-color: var(--element-bgcolor);

  color: var(--main-textcolor) !important;

  max-height: 600px;
}

.ql-snow > .ql-editor:focus {
  background-color: var(--element-bgcolor);

  color: var(--main-textcolor);
}

/* POSTS */

/* POST CONTAINER */

.mat-mdc-card {
  color: var(--main-textcolor);

  border-radius: 2px;

  border-color: var(--button-accent-color);

  box-shadow: none;
}

/* DIVIDER LINE */

app-post hr {
  color: var(--element-bgcolor);

  border: 0px;
}

/* POSTER INFO */

.original-poster-name {
  color: var(--username-textcolor) !important;

  transition: var(--color-trans);
}

.original-poster-name:hover {
  color: var(--username-textcolor-hover) !important;

  transition: var(--color-trans);
}

.original-poster-url {
  color: var(--url-textcolor);

  font-family: monospace;
}

.avatar {
  height: 45px;

  width: 45px;
}

.avatar img {
  border-radius: 3px;

  height: 45px;

  width: 45px;
}

.user-name {
  color: var(--username-textcolor) !important;

  transition: var(--color-trans);
}

.user-name:hover {
  color: var(--username-textcolor-hover) !important;

  transition: var(--color-trans);
}

span.user-url {
  color: var(--url-textcolor);

  font-family: monospace;
}

/* FOLLOW BUTTON */

button.follow-button {
  background: none !important;

  color: #69f0ae !important;

  border: none !important;

  transition: var(--color-trans);
}

button.follow-button:hover {
  background: none !important;

  color: var(--link-textcolor-hover) !important;

  border: none !important;

  transition: var(--color-trans);
}

.mat-mdc-button-persistent-ripple {
  display: none;
}

/* POST DATE */

/*

div.date-line {}

svg.fa-globe {}

*/

/* POST SHARE */

app-post-actions button:hover {
  background: none !important;

  border-width: 0px;
}

svg.fa-share-nodes {
  color: var(--button-accent-color);

  transition: var(--color-trans);
}

svg.fa-share-nodes:hover {
  color: var(--button-accent-color-hover);

  transition: var(--color-trans);
}

svg.fa-chevron-down {
  color: var(--button-accent-color);

  transition: var(--color-trans);
}

svg.fa-chevron-down:hover {
  color: var(--button-accent-color-hover);

  transition: var(--color-trans);
}

/* CONTENT WARNING */

#fragment-content-warning {
  color: var(--main-textcolor);

  font-family: monospace;
}

/*

div.fragment-content-warning div.fragment-content {}

div.fragment-content-warning button {}

*/

/* POST TEXT */

div.wafrn-text-default {
  color: var(--main-textcolor);

  font-family: Georgia, serif;
}

/* MENTIONS */

a.mention {
  color: var(--username-textcolor);

  transition: var(--color-trans);
}

a.mention:hover {
  color: var(--username-textcolor-hover);

  transition: var(--color-trans);
}

/* MEDIA CONTAINER */

app-wafrn-media {
  max-width: 57%;

  display: block;

  margin-left: auto;

  margin-right: auto;
}

/* IMAGES */

app-wafrn-media img {
  filter: brightness(0.7);

  transition: var(--image-transoff);
}

app-wafrn-media img:hover {
  filter: brightness(1);

  transition: var(--image-trans);
}

/* MEDIA DESCRIPTION */

app-wafrn-media div.media-description {
  background-color: var(--element-bgcolor) !important;

  border-radius: 0px;

  font-family: monospace;

  font-size: 11px;
}

/* VOTING */

/*

.mdc-linear-progress__bar-inner {}

.mdc-linear-progress__buffer-bar {}

*/

/* TAGS */

a.tag {
  background-color: #8531a9 !important;

  color: var(--link-textcolor) !important;

  transition: var(--color-trans);

  font-family: monospace;
}

a.tag:hover {
  color: var(--link-textcolor-hover) !important;

  transition: var(--color-trans);
}

/* container of quoted post */

div.quoted-post {
  border-width: 2px;

  border-color: var(--button-accent-color);

  border-style: dotted;

  box-shadow: none;
}

/* REACTS */

#emoji-reactions button {
  background-color: var(--element-bgcolor);

  border-width: 0px !important;

  transition: var(--color-trans);

  fill: var(--main-textcolor);
}

#emoji-reactions button:hover {
  background-color: var(--button-bgcolor-hover);

  transition: var(--color-trans);

  fill: var(--main-textcolor);
}

/*

#emoji-reactions .mat-mdc-tooltip-trigger {}

#emoji-reactions .mat-mdc-tooltip-trigger:hover {}

*/

app-emoji-react svg {
  fill: var(--main-textcolor);

  transition: var(--color-trans);
}

app-emoji-react svg:hover {
  fill: var(--link-textcolor-hover);

  transition: var(--color-trans);
}

/*

div.emojireact-overlay {}

*/

/* POST ACTIONS */

/*

app-post hr > div a {}

app-post hr > div a:hover {}

*/

fa-icon[mattooltip="Quote woot"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Quote woot"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Quick rewoot"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Quick rewoot"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Delete rewoot"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Delete rewoot"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Reply woot"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Reply woot"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Like woot"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Like woot"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Remove like"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Remove like"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Delete woot"] {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}

fa-icon[mattooltip="Delete woot"]:hover {
  color: var(--main-textcolor);

  transition: var(--color-trans);
}
```
````
