export function generate_new_id(arr) {
    let max_id = 0;
    arr.forEach(item => { max_id = Math.max(max_id, item.id) });
    return max_id + 1;
}

export function now() {
    return new Date().toISOString();
}

export function date(date_str) {
    return new Date(date_str);
}

export function sort_by(property, order = 'asc') {
    let sortOrder = order === 'asc' ? 1 : -1;
    return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

export function filter_array_by(arr, field, value) {
    return arr.filter(item => item[field] === value);
}

export function filter_array(arr, filters) {
    const { date_from, date_to, orderby, order, limit } = filters;
    let filtered = arr;

    if (date_from !== undefined) {
        filtered = filtered.filter(post => date(date_from) <= date(post.datetime));
    }

    if (date_to !== undefined) {
        filtered = filtered.filter(post => date(date_to) >= date(post.datetime));
    }

    switch (orderby?.toLowerCase()) {
        case 'text':
            filtered.sort(sort_by('text', order));
            break;
        case 'datetime':
            filtered.sort(sort_by('datetime', order));
            break;
        case 'id':
        default:
            filtered.sort(sort_by('id', order));
            break;
    }

    filtered.length = Math.min(filtered.length, limit !== undefined ? parseInt(limit) : 10);

    return filtered;
}