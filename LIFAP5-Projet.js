/* global downloadPromise uploadPromise resetPromise updatePromise */
/* see http://eslint.org/docs/rules/no-undef */

/************************************************************** */
/* CONSTANTES */
/************************************************************** */
//api key vincent : 531ad470e989a1b2c36e
//api_key kevin : d5b1e380847e1c54c706
const local_todos = "./Projet-2018-todos.json";
const local_users = "./Projet-2018-users.json";
const api_header = 'X-API-KEY';
const api_key_value = 'd5b1e380847e1c54c706';
const user_loggin = 'p1507706';
const url_users = 'http://lifap5.univ-lyon1.fr/index.php/users/';
const url_todos = 'http://lifap5.univ-lyon1.fr/index.php/todos/';
var id_todo;
////////////////////////////////////////////////////////////////////////////////
// ETAT : classe d'objet pour gérer l'état courant de l'application
////////////////////////////////////////////////////////////////////////////////

function State(users = [], todos = [], filters = [], sort = "NONE"){
  this.users  = users;
  this.todos  = todos;
  this.filters = filters;
  this.sort   = sort;

  //returns the JSON object of a user
  this.get_user_info = (user_id) => {    
    return this.users.find((o)=>o['_id']===user_id);
  };

  //returns the TODO objects created by a user
  this.get_user_todos = (user_id) => {
    console.debug(`get_user_todos(${user_id})`); // with ${this.todos}
    const result = this.todos.filter( o => o['createdBy']===user_id );
    return result;
  };

  //returns the TODO objects where a user is mentioned
  this.get_mentioned_todos = (user_id) => {
    let mentioned_todos = [];
    return mentioned_todos;
  };
}//end State

////////////////////////////////////////////////////////////////////////////////
// OUTILS : fonctions outils, manipulation et filtrage de TODOs
////////////////////////////////////////////////////////////////////////////////
function compare (param)
{ //retourne une fonction de comparaison en fonction du parametre param
	return function (a,b) 
	{
		if (param === "title")
		{
			if (a.title > b.title){return 1;}
			else if (a.title === b.title){return 0;}
			else {return -1;}
		}
		else if (param === "status")
		{
			if (a.status>b.status){return 1;}
			else if (a.status === b.status){return 0;}
			else {return -1;}
		}
		else
		{
			if (a.deadline > b.deadline){return 1;}
			else if (a.deadline === b.deadline){return 0;}
			else {return -1;}
		}
	}
}

function creer_todo (state)
{ //stocke un TODO, puis l'envoie au serveur sous la forme d'une requette.
	let headers = new Headers();
	headers.set(api_header, api_key_value);
	const mon_todo = { 
	'deadline': document.getElementById("upload-deadline").value,
	'title': document.getElementById("upload-title").value, 
	'desc': document.getElementById("upload-desc").value,
	'status': document.getElementById("upload-state").value,
	'people': document.getElementById("upload-mentioned").value.split(',')
	};
	const data = JSON.stringify(mon_todo);
	fetch(url_todos, { method: 'POST', headers: headers, body: data })
    .then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            console.log(`Erreur dans la requête ${url_todos}: ${response.code}`);
            throw("Erreur lors de la requête sur le serveur");
        }
    })
    .then(function(todoEnJson) { // todoEnJson contient le todo créé sur le serveur
		alert('votre todo a bien ete cree');
		Promise.all([get_users(),get_todos()]) //recréation de state
		.then(values => values.map(JSON.parse))
		.then(values => new State(values[0], values[1]))
		.then(state => lire_users_json(state))
		.catch(reason => console.error(reason));
    });
}

function supprimer_todo (i)
{ //supression d'un todo en fonction de son "_id".
  let requestURL = url_todos+i; //génération de l'url du todo en fonction de l'indice i.
  let headers = new Headers();
  headers.set(api_header, api_key_value);
  fetch(requestURL, { method: 'DELETE', headers: headers })
    .then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            console.log(`Erreur dans la requête ${url}: ${response.code}`);
            throw("Erreur lors de la requête sur le serveur");
        }
    })
    .then(function(todoEnJson) {
       alert('votre todo a bien ete supprime');
	   Promise.all([get_users(),get_todos()]) //recréation de la promesse
		.then(values => values.map(JSON.parse))
		.then(values => new State(values[0], values[1]))
		.then(state => lire_users_json(state))
		.catch(reason => console.error(reason));
    });
}

function modifier_todo (i)
{ //modification d'un todo en fonction de son indice en le refabricant
  let requestURL = url_todos+i;
  let headers = new Headers();
  headers.set(api_header, api_key_value);
  const mon_todo2 = {
	'_id': i,
	'deadline': document.getElementById("upload-deadline2").value,
	'title': document.getElementById("upload-title2").value, 
	'desc': document.getElementById("upload-desc2").value,
	'status': document.getElementById("upload-state2").value,
	'createdBy': user_loggin,
	'people': document.getElementById("upload-mentioned2").value.split(',')
	};
	const data2 = JSON.stringify(mon_todo2);
	fetch(requestURL, { method: 'PUT', headers: headers, body: data2 })
    .then(function(response) {
        if (response.ok) {
            return response.json();
        } 
		else {
            console.log(`Erreur dans la requête ${url}: ${response.code}`);
            throw("Erreur lors de la requête sur le serveur");
        }
    })
    .then(function(todoEnJson) {
       alert('votre todo a bien ete modifie');
	   Promise.all([get_users(),get_todos()]) //recréation de la promesse 
		.then(values => values.map(JSON.parse))
		.then(values => new State(values[0], values[1]))
		.then(state => lire_users_json(state))
		.catch(reason => console.error(reason));
    });
}

function stocker_id (i)
{ //préremplissage des champs du formulaire de modification des todos
	id_todo = i;
	let headers = new Headers();
	headers.set(api_header, api_key_value);
	fetch(url_todos+i, { method: 'GET', headers: headers })
    .then(function(response) {
        if (response.ok) {
            return response.text();
        } else {
            console.log(`Erreur dans la requête ${url}: ${response.code}`);
            throw("Erreur lors de la requête sur le serveur");
        }
    })
    .then(todoEnTexte => JSON.parse(todoEnTexte))
    .then(function(todoEnJson) {
        document.getElementById("upload-title2").value = todoEnJson.title;
		document.getElementById("upload-deadline2").value = todoEnJson.deadline;
		document.getElementById("upload-desc2").value = todoEnJson.desc;
		document.getElementById("upload-mentioned2").value = todoEnJson.people;
		document.getElementById("upload-state2").value = todoEnJson.status;
    })
    .catch(reason => console.error(reason));
	 
}

function stocker_email(state)
{ //préremplissage des champs du formulaire de modification des users
	let headers = new Headers();
	headers.set(api_header, api_key_value);
	fetch(url_users+user_loggin, { method: 'GET', headers: headers })
    .then(function(response) {
        if (response.ok) {
            return response.text();
        } else {
            console.log(`Erreur dans la requête ${url}: ${response.code}`);
            throw("Erreur lors de la requête sur le serveur");
        }
    })
    .then(todoEnTexte => JSON.parse(todoEnTexte))
    .then(function(todoEnJson) {
        document.getElementById("upload-email").value = todoEnJson.email;
    })
    .catch(reason => console.error(reason));
	
}

function modifier_user(state)
{ //modification d'un utilisateur (photo + email)
  let requestURL = url_users+user_loggin;
  let headers = new Headers();
  let mon_user;
  headers.set(api_header, api_key_value);
  if (document.getElementById("upload-online").value === '') //si on n'a pas rempli le champs "upload-online", 
															 //on utilise une photo locale qui doit etre dans le dossier du projet.
	{
		mon_user = { 
		'_id': user_loggin,
		'joinedOn': state.get_user_info(user_loggin).joinedOn,
		'email': document.getElementById("upload-email").value, 
		'avatar': './'+document.getElementById("upload-photo").files[0].name,
	};
	}
	else //dans le cas contraire, on prend une adresse en ligne.
	{
		mon_user = { 
		'_id': user_loggin,
		'joinedOn': state.get_user_info(user_loggin).joinedOn,
		'email': document.getElementById("upload-email").value, 
		'avatar': document.getElementById("upload-online").value,
	};
	}
	const data3 = JSON.stringify(mon_user);
	fetch(requestURL, { method: 'PUT', headers: headers, body: data3 })
    .then(function(response) {
        if (response.ok) {
            return response.json();
        } 
		else {
            console.log(`Erreur dans la requête ${url}: ${response.code}`);
            throw("Erreur lors de la requête sur le serveur");
        }
    })
    .then(function(todoEnJson) {
       alert('votre profil a bien ete modifie');
	   Promise.all([get_users(),get_todos()])
		.then(values => values.map(JSON.parse))
		.then(values => new State(values[0], values[1]))
		.then(state => lire_users_json(state))
		.catch(reason => console.error(reason));
    });
}
////////////////////////////////////////////////////////////////////////////////
// RENDU : fonctions génération de HTML à partir des données JSON
////////////////////////////////////////////////////////////////////////////////
function initialisation_affichage(state)
{ //initialisation de l'affichage (message de bienvenue) + gestion des evenements
		let filtre = document.getElementById("Filtre");
		let filtre2 = document.getElementById("Filtre2");
		let user = document.getElementById("lire_users_json");
		let refresh = document.getElementById('refresh');
		let SortMyTodos = document.getElementById("SortMyTodos");
		let SortTheOthersTodos = document.getElementById("SortTheOthersTodos");
		let addTodo = document.getElementById("upload-button");
		let modifyTodo = document.getElementById("upload-button2");
		let modifyUser = document.getElementById("PreremplirUser");
		let settings = document.getElementById("settings-button");
		document.getElementById("todos").innerHTML = `<p>Hello. Welcome to my todo manager.<br/><br/> This application, developped by Vincent Lévêque and Kevin Burdin, allows you to have a global sight of your todo.<br/>
			If you want to consult your todos, you have to be registered, and you have to log yourself.Thanks.</p>
			<p><br/>In this section, you can find all the todos that you have created.</p>`;
		document.getElementById("mentioned-todos").innerHTML = `<p>In this section, you can see all the todos you are concerned about.</p>`
		user.onclick = function (){lire_users_json(state)};
		refresh.onclick = function () {location.reload()};
		filtre.onclick = function (){lire_users_json(state)};
		filtre2.onclick = function (){lire_users_json(state)};
		SortMyTodos.onclick = function (){lire_users_json(state)};
		SortTheOthersTodos.onclick = function (){lire_users_json(state)};
		addTodo.onclick = function (){creer_todo(state)};
		modifyTodo.onclick = function (){modifier_todo(id_todo)};
		modifyUser.onclick = function (){stocker_email(state)};
		settings.onclick = function (){modifier_user(state)};
}

function lire_users_json(state)
{ //connecte un utilisateur en fonction des variables "api_key_value" et "user_loggin" et affiche ses informations
	let userHTML = document.getElementById("username_logscreen").value;
	let passwordHTML = document.getElementById("userPassword").value;
	if(passwordHTML === api_key_value && userHTML === user_loggin)
	{
		document.getElementById('todos').innerHTML = '';
		document.getElementById('mentioned-todos').innerHTML = '';
		document.getElementById('idUser').innerHTML = state.get_user_info(user_loggin)["_id"];
		document.getElementById('mailaddressUser').innerHTML = '<i><a href="mailto:'+state.get_user_info(user_loggin)["email"]+'">'+state.get_user_info(user_loggin)["email"]+'</a></i><br/>';
		document.getElementById("profile-logo").innerHTML = '<img class = "img-responsive" alt="Profile" src="'+state.get_user_info(user_loggin)["avatar"]+'">';
		let date = new Date(state.get_user_info(user_loggin)["joinedOn"]);
		document.getElementById('joinedOnUser').innerHTML = '<i>joined on : '+date.getDate()+'/'+(date.getMonth()+1)+'/'+date.getFullYear()+'</i>';
		lire_todos_json(state,userHTML);
		lire_mentioned_todos_json(state,userHTML);
		
	}
	else
	{
		alert('autentification failed, maybe your password or your username were wrong.');
	}
}

function lire_todos_json(state,user)
{ //une fois la connexion effectuee, lecture de l'ensemble des todos que l'utilisateur a cree.
	let filtre = document.getElementById("Filtre").value;
	let tri = document.getElementById("SortMyTodos").value;
	if (filtre === 'TOUT') //filtrage des todos en fonction de leur etat.
	{
		state.get_user_todos(user).sort(compare(tri)).map(todo => document.getElementById("todos").innerHTML += '<div class="panel panel-success"><div class="panel-heading" onclick="afficherTodo(\''+todo["_id"]+'\')">'+todo["title"]+'<button type="button" class="glyphicon glyphicon-pencil btn btn-warning pull-right btn-xs" data-toggle="modal" data-target="#uploadModal2" onclick="stocker_id(\''+todo["_id"]+'\')"></button><button type="button" class="glyphicon glyphicon-trash btn btn-danger pull-right btn-xs" onclick="supprimer_todo(\''+todo["_id"]+'\')"></button></div></div>');
	}
	else
	{
		state.get_user_todos(user).filter(todo => todo.status === filtre).sort(compare(tri)).map(todo => document.getElementById("todos").innerHTML += '<div class="panel panel-success"><div class="panel-heading" onclick="afficherTodo(\''+todo["_id"]+'\')">'+todo["title"]+'<button type="button" class="glyphicon glyphicon-pencil btn btn-warning pull-right btn-xs" data-toggle="modal" data-target="#uploadModal2" onclick="stocker_id(\''+todo["_id"]+'\')"></button><button type="button" class="glyphicon glyphicon-trash btn btn-danger pull-right btn-xs" onclick="supprimer_todo(\''+todo["_id"]+'\')"></button></div></div>');
	}
}
function lire_mentioned_todos_json(state,user)
{ //une fois la connexion effectuee, lecture de l'ensemble des todos qui mentionnent l'utilisateur.
	let filtre = document.getElementById("Filtre2").value;
	let tri = document.getElementById("SortTheOthersTodos").value;
	if(filtre ==='TOUT') //filtrage des todos en fonction de leur etat.
	{
		state.todos.sort(compare(tri)).map(todo => (todo.people != undefined ? (todo.people.indexOf(user) >=0 ? document.getElementById("mentioned-todos").innerHTML += '<div class="panel panel-success"><div class="panel-heading" onclick="afficherTodo(\''+todo["_id"]+'\')">'+todo["title"]+'</div></div>' : console.log(todo.people)):console.log('todo.people is undefined')));
	}
	else
	{
		state.todos.filter(todo => todo.status === filtre).sort(compare(tri)).map (todo => (todo.people != undefined ? (todo.people.indexOf(user) >=0 ? document.getElementById("mentioned-todos").innerHTML += '<div class="panel panel-success"><div class="panel-heading" onclick="afficherTodo(\''+todo["_id"]+'\')">'+todo["title"]+'</div></div>' : console.log(todo.people)) : console.log('todo.people is undefined')));
	}
}
////////////////////////////////////////////////////////////////////////////////
// HANDLERS : gestion des évenements de l'utilisateur dans l'interface HTML
////////////////////////////////////////////////////////////////////////////////
function afficherTodo(i)
{ //affichage des détails du todo lorque l'utilisateur clique dessus.
  let requestURL = url_todos+i;
  let headers = new Headers();
  headers.set(api_header, api_key_value);
  fetch(requestURL, { method: 'GET', headers: headers })
    .then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            console.log(`Erreur dans la requête ${url_todos+i}: ${response.code}`);
            throw("Erreur lors de la requête sur le serveur");
        }
    })
    .then(function(todoEnJson) {
        document.getElementById("todoSelected").innerHTML= '<div class="panel panel-success"><div class="panel-heading">'+todoEnJson["title"]+'</div><div class="panel-body">'+todoEnJson["desc"]+'<br/><br/>with : '+todoEnJson["people"]+'<br/>created the '+todoEnJson["creation"]+'<br/>deadline : '+todoEnJson["deadline"]+'<br/>status : '+todoEnJson["status"]+'</div></div>';
    });
}
////////////////////////////////////////////////////////////////////////////////
// FETCH Fonction permettant de charger des données asynchrones
////////////////////////////////////////////////////////////////////////////////
function get_local_todos() {
  return fetch(local_todos)
    .then(response => response.text())
}

function get_local_users() {
  return fetch(local_users)
    .then(response => response.text())
}

function get_todos()
{
	let headers = new Headers();
	headers.set(api_header, api_key_value);
	return fetch(url_todos, { method: 'GET', headers: headers })
    .then(response => response.text())
}

function get_users()
{
	let headers = new Headers();
	headers.set(api_header, api_key_value);
	return fetch(url_users, { method: 'GET', headers: headers })
    .then(response => response.text())
}

/************************************************************** */
/** MAIN PROGRAM */
/************************************************************** */
document.addEventListener('DOMContentLoaded', function(){
  // garde pour ne pas exécuter dans la page des tests unitaires.
  if (document.getElementById("title-test-projet") == null) {

    Promise.all([get_users(),get_todos()])
	.then(values => values.map(JSON.parse))
    .then(values => new State(values[0], values[1]))
    .then(state => initialisation_affichage(state))//lancement de la fonction initiale
    .catch(reason => console.error(reason));
  }
}, false);
