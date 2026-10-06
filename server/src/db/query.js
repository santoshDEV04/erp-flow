import pool from "../config/db.js";

const query = (text, params) => {
    return pool.query(text, params);
}

export default query;