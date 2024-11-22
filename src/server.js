const express = require("express");
const myConnection = require('express-myconnection');
const mysql = require('mysql');
const morgan = require('morgan');
const path = require('path');
const customerRoutes = require('./routes/customer');  // Asegúrate de que las rutas estén correctas

const app = express();

const PORT = 3000;

// vistas  
app.set("view engine", "ejs");
// rutas de las vistas con path
app.set("views", path.join(__dirname, "views"));

// middleware, antes de las peticiones de los usuarios
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));

// middleware de conexión a la base de datos
app.use(myConnection(mysql, {
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    database: 'crudnode'
}, 'single'));
app.use(express.urlencoded({extended: false}))

// rutas
app.use(customerRoutes);

// archivos estaticos imágenes, estilos framework 
app.use(express.static(path.join(__dirname, "public")));

// Inicia el servidor después de configurar todo
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
});
