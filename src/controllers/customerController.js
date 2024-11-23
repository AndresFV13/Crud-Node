const controller = {};

controller.list = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) {
            return res.json(err); 
        }
        conn.query('SELECT * FROM customer', (err, customers) => {
            if (err) {
                return res.json(err);
            }
            res.render('customers', {
                data: customers  
            });
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
