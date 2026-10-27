import express from 'express';
import dotenv from 'dotenv';
import conexao from './db.js';

dotenv.config();

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        mensagem: 'API de tarefas funcionando!'
    });
});

app.get('/teste-banco', async (req, res) => {
    try {
        const [resultado] = await conexao.query(
            'SELECT 1 AS conectado'
        );

        res.json({
            mensagem: 'Conexão com o MariaDB funcionando!',
            resultado: resultado[0]
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Não foi possível conectar ao banco de dados.'
        });
    }
});

const PORTA = process.env.PORT || 3000;

app.post('/tarefas', async (req, res) => {
    try {
        const {
            nome,
            descricao,
            responsavel,
            data_tarefa,
            concluido
        } = req.body;

        const sql = `
            INSERT INTO tarefas
            (nome, descricao, responsavel, data_tarefa, concluido)
            VALUES (?, ?, ?, ?, ?)
        `;

        const valores = [
            nome,
            descricao,
            responsavel,
            data_tarefa,
            concluido ?? false
        ];

        const [resultado] = await conexao.query(sql, valores);

        res.status(201).json({
            mensagem: 'Tarefa cadastrada com sucesso!',
            id: resultado.insertId
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao cadastrar tarefa.'
        });
    }
});

app.get('/tarefas/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await conexao.query(
            'SELECT * FROM tarefas WHERE id = ?',
            [id]
        );

        if (resultado.length === 0) {
            return res.status(404).json({
                mensagem: 'Tarefa não encontrada.'
            });
        }

        res.json(resultado[0]);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao consultar tarefa.'
        });
    }
});

app.get('/tarefas', async (req, res) => {
    try {
        const { inicio, fim } = req.query;

        if (!inicio || !fim) {
            return res.status(400).json({
                erro: 'Informe a data inicial e a data final.'
            });
        }

        if (inicio > fim) {
            return res.status(400).json({
                erro: 'A data inicial não pode ser maior que a final.'
            });
        }

        const sql = `
            SELECT * FROM tarefas
            WHERE data_tarefa BETWEEN ? AND ?
            ORDER BY data_tarefa ASC
        `;

        const [resultado] = await conexao.query(
            sql,
            [inicio, fim]
        );

        res.json(resultado);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao listar tarefas por período.'
        });
    }
});

app.put('/tarefas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nome,
            descricao,
            responsavel,
            data_tarefa,
            concluido
        } = req.body;

        const sql = `
            UPDATE tarefas
            SET nome = ?,
                descricao = ?,
                responsavel = ?,
                data_tarefa = ?,
                concluido = ?
            WHERE id = ?
        `;

        const valores = [
            nome,
            descricao,
            responsavel,
            data_tarefa,
            concluido,
            id
        ];

        const [resultado] = await conexao.query(sql, valores);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Tarefa não encontrada.'
            });
        }

        res.json({
            mensagem: 'Tarefa atualizada com sucesso!'
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao atualizar tarefa.'
        });
    }
});

app.delete('/tarefas/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await conexao.query(
            'DELETE FROM tarefas WHERE id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Tarefa não encontrada.'
            });
        }

        res.json({
            mensagem: 'Tarefa excluída com sucesso!'
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao excluir tarefa.'
        });
    }
});

app.listen(PORTA, () => {
    console.log(`Servidor rodando na porta ${PORTA}`);
});