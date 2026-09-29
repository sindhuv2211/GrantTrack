document.addEventListener('DOMContentLoaded', function () {
    var sel = document.getElementById('statusSelect');
    var amtGroup = document.getElementById('approvedAmountGroup');
    if (sel && amtGroup) {
        function toggle() {
            amtGroup.style.display = sel.value === 'APPROVED' ? 'block' : 'none';
        }
        sel.addEventListener('change', toggle);
        toggle();
    }
});
