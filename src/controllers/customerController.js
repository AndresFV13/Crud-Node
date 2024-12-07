const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const controller = {};

controller.list = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) return res.status(500).send('Error de conexión');
        conn.query('SELECT * FROM customer', (err, customers) => {
            if (err) return res.status(500).send('Error al obtener datos');
            res.render('customers', { data: customers }); 
        });
    });
};


controller.save = (req, res) => {
    const data = req.body;

    req.getConnection((err, conn) => {
        conn.query('INSERT INTO customer set ?', [data], (err, customer) => {
            res.redirect('/list');
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
                conn.query('INSERT INTO users (username, password, registered_at) VALUES (?, ?, NOW())', [username, hashedPassword], (err, result) => {
                    if (err) return res.status(500).send({ message: 'Error al registrar el usuario.' });

                    // Obtener el ID del usuario insertado
                    const userId = result.insertId; // El ID del nuevo usuario
                    req.session.user = { id: userId, username }; // Guardar en la sesión
                    res.redirect('/list'); // Redirigir a la lista de usuarios
                });
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error al encriptar la contraseña.' });
            }
        });
    });
};


controller.login = (req, res) => {
    res.render('login');
};

controller.loginUser = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).render('login', { message: 'Por favor, complete todos los campos.' });
    }

    req.getConnection((err, conn) => {
        if (err) return res.status(500).send({ message: 'Error de conexión con la base de datos.' });

        conn.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) return res.status(500).send({ message: 'Error al buscar el usuario.' });
            if (results.length === 0) {
                return res.status(401).render('login', { message: 'Usuario o contraseña incorrectos.' });
            }

            const user = results[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.status(401).render('login', { message: 'Usuario o contraseña incorrectos.' });
            }

            req.session.user = { id: user.id, username: user.username };
            res.redirect('/list'); 
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
                res.redirect('/list'); 
            }
        );
    });
};

controller.delete = (req, res) => {
    const {id} = req.params;

    req.getConnection((err, conn) => {
        conn.query('DELETE FROM customer WHERE id = ?', [id], (err, rows) => {
            res.redirect('/list');
        });
    })
}

controller.complaint = (req, res) => {
    res.render('complaint');
}

controller.submitComplaint = async (req, res) => {
    const { name, email, complaint } = req.body;

    // Configuración de Nodemailer con Mailtrap
    const transporter = nodemailer.createTransport({
        host: 'sandbox.smtp.mailtrap.io', 
        port: 2525, 
        auth: {
            user: 'a3cd15ebc44564', 
            pass: '0a11ca4b325fa0', 
        },
    });

    const mailOptions = {
        from: email, 
        to: email, 
        subject: 'Nueva Queja Recibida',
        text: `Has recibido una nueva queja:

        Nombre: ${name}
        Correo: ${email}
        Queja: ${complaint}
        Fecha: ${new Date().toLocaleString()}` // Formato legible para la fecha
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Correo enviado exitosamente' });
    } catch (error) {
        console.error('Error al enviar la queja:', error);
        res.status(500).json({ message: 'Error al enviar la queja' });
    }
};

module.exports = controller;
