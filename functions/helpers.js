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
    let sortOrder = order == 'asc' ? 1 : -1;
    return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

export function filter_array_by(arr, field, value) {
    return arr.filter(item => item[field] == value);
}

export function find_array_by(arr, field, value) {
    return arr.find(item => item[field] == value);
}

export function find_array_index_by(arr, field, value) {
    return arr.findIndex(item => item[field] == value);
}

export function filter_array(arr, filters) {
    const { date_from, date_to, status, orderby, order, limit } = filters;
    let filtered = [...arr];

    if (date_from !== undefined) {
        filtered = filtered.filter(item => date(date_from) <= date(item.datetime));
    }

    if (date_to !== undefined) {
        filtered = filtered.filter(item => date(date_to) >= date(item.datetime));
    }

    if (status !== undefined) {
        filtered = filtered.filter(item => status == item.status);
    }

    switch (orderby?.toLowerCase()) {
        case 'text':
            filtered.sort(sort_by('text', order));
            break;

        case 'datetime':
            filtered.sort(sort_by('datetime', order));
            break;

        case 'status':
            filtered.sort(sort_by('status', order));
            break;

        case 'id':
        default:
            filtered.sort(sort_by('id', order));
            break;
    }

    filtered.length = Math.min(filtered.length, limit !== undefined ? parseInt(limit) : 10);

    return filtered;
}

export function delete_keys( obj, keys ) {
    const new_obj = Object.assign({}, obj);
    keys.forEach( key => delete new_obj[key] );
    return new_obj;
}