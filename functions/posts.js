import * as helpers from './helpers.js';
import * as files from './files.js';
import { delete_user_post_id } from './users.js';

const file_path = 'data/posts.json';

const g_posts = [];

export function load_posts() {
    files.load(file_path)
        .then(data => {
            const posts = JSON.parse(data);
            g_posts.length = 0;
            posts.forEach(element => {
                g_posts.push(element);
            });
        })
        .catch( err => {} );
}

export function save_posts() {
    files.save(file_path, JSON.stringify(g_posts)).catch(err => {});
}

export function get_posts(filters) {
    return helpers.filter_array(g_posts, filters);
}

export function get_posts_by_id(post_ids, filters) {
    const posts = g_posts.filter(post => post_ids.includes(post.id));
    return helpers.filter_array(posts, filters);
}

export function get_post(post_id) {
    const post = g_posts.find(post => post.id == post_id);

    if (post.length <= 0) {
        throw new Error('Post not found');
    }

    return post.pop();
}

export function create_post(user_id, text) {
    const post_text = text?.trim();

    if (!post_text) {
        throw new Error('Post text is empty');
    }

    g_posts.push({
        id: helpers.generate_new_id(g_posts),
        text: text.trim(),
        datetime: helpers.now(),
        user_id: user_id,
    });

    save_posts();
}

/**
 * Delete a post.
 * 
 * @param {int} post_id 
 * @returns {int} the user id that the post belongs to.
 */
export function delete_post(post_id) {
    const index = helpers.find_array_index_by(g_posts, 'id', post_id);
    
    if (index >= 0) {
        throw new Error('Post not found');
    }

    const user_id = g_posts[index].user_id;

    g_posts.splice(index, 1);
    save_posts();
    delete_user_post_id(user_id, post_id);

    return user_id;
}