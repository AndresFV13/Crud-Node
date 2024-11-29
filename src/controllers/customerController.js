const bcrypt = require('bcrypt');
const controller = {};

controller.list = (req, res) => {
    req.getConnection((err, conn) => {
        if (!req.session.userId) {
            return res.redirect('/login');
        }
        if (err) return res.status(500).send("Error al conectar a la base de datos.");
        
        // Realiza la consulta para obtener todos los clientes
        conn.query('SELECT * FROM customer', (err, results) => {
            if (err) {
                return res.status(500).send("Error al obtener los clientes.");
            }
            // Pasa los datos a la vista
            res.render('customers', { data: results });
        });
    });
};

controller.save = (req, res) => {
    const data = req.body;

    req.getConnection((err, conn) => {
        conn.query('INSERT INTO customer set ?', [data], (err, customer) => {
            res.redirect('/');
        });
    })
}

controller.edit = (req, res) => {
    const { id } = req.params;
    req.getConnection((err, conn) => {
        conn.query('SELECT * FROM customer WHERE id = ?', [id], (err, customer) => {
            if (err) return res.status(500).send('Error al cargar los datos');
            res.render('customer-edit', { 
                data: customer[0] 
            });
        });
    });
};

controller.updateUser = (req, res) => {
    const { id } = req.params;
    req.getConnection((err, conn) => {
        if (err) return res.status(500).send(err);
        conn.query('SELECT * FROM customer WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).send(err);
            if (results.length === 0) {
                return res.status(404).send({ message: 'Cliente no encontrado' });
            }
            res.json(results[0]); 
        });
    });
}

controller.register = (req, res) => {
    res.render('register');
};

controller.registerUser = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ message: 'Por favor, complete todos los campos.' });
    }

    req.getConnection(async (err, conn) => {
        if (err) return res.status(500).send({ message: 'Error de conexión con la base de datos.' });

        // Comprobar si el usuario ya existe
        conn.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) return res.status(500).send({ message: 'Error al buscar el usuario.' });
            if (results.length > 0) {
                return res.status(400).send({ message: 'El usuario ya está registrado.' });
            }

            try {
                // Encriptar la contraseña
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insertar nuevo usuario
                conn.query('INSERT INTO users (username, password, registration_date) VALUES (?, ?, NOW())', [username, hashedPassword], (err) => {
                    if (err) return res.status(500).send({ message: 'Error al registrar el usuario.' });
                    res.redirect('/'); // Redirige a la vista de login tras registro exitoso
                });
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error al encriptar la contraseña.' });
            }
        });
    });
};

controller.login = (req, res) => {
    res.render('login'); // Renderiza la vista de login para solicitudes GET
};

controller.loginUser = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ message: 'Por favor, complete todos los campos.' });
    }

    req.getConnection((err, conn) => {
        if (err) return res.status(500).send({ message: 'Error de conexión con la base de datos.' });

        // Buscar al usuario en la base de datos
        conn.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) return res.status(500).send({ message: 'Error al buscar el usuario.' });
            if (results.length === 0) {
                return res.status(401).send({ message: 'Usuario no encontrado.' });
            }

            const user = results[0];

            try {
                // Comparar la contraseña ingresada con la encriptada
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    return res.status(401).send({ message: 'Contraseña incorrecta.' });
                }

                // Establecer la sesión
                req.session.userId = user.id;
                res.redirect('/'); // Redirigir a la página principal tras login exitoso
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error al comparar la contraseña.' });
            }
        });
    });
};

controller.update = (req, res) => {
    const { id } = req.params;
    const { name, address, phone } = req.body;
    req.getConnection((err, conn) => {
        if (err) return res.status(500).send(err);
        conn.query(
            'UPDATE customer SET name = ?, address = ?, phone = ? WHERE id = ?',
            [name, address, phone, id],
            (err, result) => {
                if (err) return res.status(500).send(err);
                res.redirect('/'); 
            }
        );
    });
};

controller.delete = (req, res) => {
    const {id} = req.params;

    req.getConnection((err, conn) => {
        conn.query('DELETE FROM customer WHERE id = ?', [id], (err, rows) => {
            res.redirect('/');
        });
    })
}

module.exports = controller;
