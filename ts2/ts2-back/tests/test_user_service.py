from unittest.mock import MagicMock

import pytest
from sqlalchemy.exc import IntegrityError

from app.db.models import Usuario
from app.services import user_service
from app.services.user_service import CadastroConflitoError


class TestCreateUser:
    def test_persiste_usuario_com_dados_do_schema(self, db, user_create):
        result = user_service.create_user(db, user_create)

        # Um único Usuario foi adicionado à sessão...
        db.add.assert_called_once()
        added = db.add.call_args.args[0]
        assert isinstance(added, Usuario)
        assert added.nome == user_create.nome
        assert added.email == user_create.email
        assert added.senha == user_create.senha
        assert added.documento == user_create.documento

        # ...e a transação foi confirmada e o objeto recarregado/retornado.
        db.commit.assert_called_once()
        db.refresh.assert_called_once_with(added)
        db.rollback.assert_not_called()
        assert result is added

    def test_email_duplicado_vira_erro_de_dominio_e_faz_rollback(self, db, user_create):
        db.commit.side_effect = IntegrityError("stmt", "params", Exception("dup"))

        with pytest.raises(CadastroConflitoError):
            user_service.create_user(db, user_create)

        db.rollback.assert_called_once()
        db.refresh.assert_not_called()


class TestGetUsers:
    def test_retorna_todos_os_usuarios_da_query(self, db):
        usuarios = [Usuario(id=1), Usuario(id=2)]
        query = MagicMock()
        query.all.return_value = usuarios
        db.query.return_value = query

        result = user_service.get_users(db)

        db.query.assert_called_once_with(Usuario)
        query.all.assert_called_once()
        assert result == usuarios
