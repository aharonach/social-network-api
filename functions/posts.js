import * as helpers from './helpers.js';

const file_path = '../data/posts.json';

const g_posts = [];

export function create_post(user_id, text) {
    g_posts.push({
        id: helpers.generate_new_id(g_posts),
        text: text.trim(),
        datetime: helpers.now(),
        user_id: user_id,
    });
}

export function delete_post(post_id) {
    g_posts.splice(g_posts.findIndex(post => post.id === post_id), 1);
}

export function get_posts(filters) {
    return helpers.filter_array( g_posts, filters );
}