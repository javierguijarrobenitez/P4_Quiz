
const {log, biglog, errorlog, colorize} = require("./out");
const model = require('./model');

/**
 * Muestra la ayuda
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = rl => {
    log("Comandos:");
    log(" h|help - Muestra esta ayuda.");
    log(" list - Listar los quizzes existentes.");
    log(" show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log(" add - Añadir un nuevo quiz interactivamente.");
    log(" delete <id> - Borras el quiz indicado.");
    log(" edit <id> - Editar el quiz indicado.");
    log(" test <id> - Probar el quiz indicado.");
    log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(" credits - Créditos.");
    log(" q|quit - Salir del programa");
    rl.prompt();
};

/**
 * Lista todos los quizzes existentes en el modelo
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = rl => {
    model.getAll().forEach((quiz, id) => {
        log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
    });
    rl.prompt();
};

/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl,id) => {
    if(typeof id === "undefined"){
        errorlog(`Falta el parámetro id.`);
    }else{
        try {
            const quiz = model.getByIndex(id);
            log(`[${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch(error){
            errorlog(error.message);
        }
    }
    rl.prompt();
};

/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y la respuesta.
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada al rl.prompt() se debe hacer en la callback de la segunda
 * llamada al rl.question.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = rl =>{
    rl.question(colorize('Introduzca una pregunta:', 'red'), question =>{
        rl.question(colorize('Introduzca la respuesta', 'red'), answer =>{
            model.add(question,answer);
            log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt();
        });
    });
};

/**
 * Borra un quiz del modelo
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar del modelo.
 */
exports.deleteCmd = (rl, id) => {

    if(typeof id === "undefined"){
        errorlog(`Falta el parámetro id.`);
    }else{
        try {
            model.deleteByIndex(id);
        } catch(error){
            errorlog(error.message);
        }
    }
    rl.prompt();
};

/**
 * Edita un quiz del modelo.
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl, id) => {
    if(typeof id === "undefined"){
        errorlog(`Falta el parámetro id`);
        rl.prompt();
    }else{
        try{
            const quiz = model.getByIndex(id);
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0)
            rl.question(colorize('Introduzca una pregunta:', 'red'), question =>{
                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
                rl.question(colorize('Introduzca una respuesta', 'red'), answer =>{
                    model.update(id, question, answer);
                    log(`Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>','magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        }catch (error){
            errorlog(error.message);
            rl.prompt();
        }
    }
};

/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl, id) => {
    if(typeof id === "undefined"){
        errorlog('Falta el parametro id');
        rl.prompt();
    }else{
        try{
            let quiz = model.getByIndex(id);

            rl.question(colorize(`${quiz.question}${colorize('?', 'red')}`, 'red'), answer =>{
               
                if(quiz.answer.toLowerCase() === answer.trim().toLowerCase()){
                    log(`Su respuesta es:`);
                    biglog('correcta', 'green');
                }else {
                    log(`Su respuesta es:`);
                    biglog('incorrecta', 'red');
                }
                rl.prompt();
            });


        }catch (error){
            errorlog(error.message);
            rl.prompt();
        }
    }
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todas satisfactoriamente.
 * @param rl Objeto readline usado para implementar el CLI.
 */

exports.playCmd = rl => {

    let score = 0;
    let toBeResolved = [];
    var i;
    for(i = 0; i<model.count(); i++ ){
        toBeResolved[i] = i;
    };

    const playOne = () =>{
        if(toBeResolved.length == 0){
            log('No hay más preguntas.');
            log('Fin del examen. Aciertos:');
            biglog(`${score}`);
            rl.prompt();
        }else{
            let tamaño = toBeResolved.length -1;
            let id = toBeResolved[Math.trunc(Math.random()*tamaño)];
            let quiz = model.getByIndex(id);
            var i;
            for(i =0; i<toBeResolved.length; i++){
                if(toBeResolved[i] == id){
                    toBeResolved.splice(i, 1);
                }
            }
            rl.question(colorize(`${quiz.question}?`, 'red'), answer => {
                if(quiz.answer.toLowerCase() === answer.trim().toLowerCase()){
                    score += 1;
                    log(`${colorize('La respuesta es', 'black')} ${colorize('correcta', 'green')}`);
                    playOne();
                }else{
                    log('Incorrecto');
                    log('Fin del examen. Aciertos:');
                    biglog(`Aciertos: ${score}`, 'blue');
                    rl.prompt();
                };
            });
        }
    }
    playOne();
};

/**
 * Muestra los nombres de los autores de la practica.
 * @param rl Objeto readline usado para implementar el CLI.
 */

exports.creditsCmd = rl =>{
    log('Autores de la práctica:');
    log('Irene Rodríguez Gómez', 'green');
    rl.prompt();
};

/**
 * Terminar el programa.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = rl => {
    rl.close();
};