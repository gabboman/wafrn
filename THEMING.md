# Theme template for WAFRN

### Small rickroll detector

Add this to detect rickrolls

```css
a[href *= "dQw4w9WgXcQ"]::before {
    content: "this is a rickroll → ";
    color: red;
    background-color: white;
    border-radius: 5px;
    padding: 2px;
}
```

### Initial template made by @fizzyday@app.wafrn.net

Here is a theming template you can use to customize the appearance of your profile and how the dashboard appears to you.

It is not complete, nor perfect, but the most important elements are there, have fun playing with it:)

Watch out for when you copy the css into wafrn, it changes the double-space indentations to single spaces, you may have to correct that manually for it to work.

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

--color-trans: 0.37s cubic-bezier(0.77,0,0.23,1);

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

color:var(--link-textcolor-visited);

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

color:var(--main-textcolor);

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

color:var(--main-textcolor);

border-width: 0px;

transition: var(--color-trans);

}



button[aria-label="Go back to the dashboard"] {

background-color: var(--button-bgcolor);

border-color: var(--button-accent-color);

color:var(--main-textcolor);

transition: var(--color-trans);

}

button[aria-label="Go back to the dashboard"]:hover {

background-color: var(--button-bgcolor-hover);

border-color: var(--button-accent-color-hover);

color:var(--main-textcolor);

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

max-height: 600px

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
