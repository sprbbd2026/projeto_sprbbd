from unittest.mock import MagicMock

import pytest
from sqlalchemy.exc import IntegrityError

from app.db.models import Usuario
from app.services import user_service
from app.services.user_service import CadastroConflitoError


class TestCreateUser:
    def test_persiste_usuario_com_dados_do_schema(self, db, user_create):
        result = user_service.create_user(db, user_create)

        # A função cria usuario, dispositivo e usuario_dispositivo (3 add calls)
        assert db.add.call_count == 3
        
        # Primeira chamada: Usuario
        primeiro_add = db.add.call_args_list[0].args[0]
        assert isinstance(primeiro_add, Usuario)
        assert primeiro_add.nome == user_create.nome
        assert primeiro_add.email == user_create.email
        assert primeiro_add.senha != user_create.senha  # Senha está hashada
        assert len(primeiro_add.senha) > 20  # Senha hashada tem tamanho grande
        assert primeiro_add.documento == user_create.documento

        # Múltiplos commits (um para usuario, um para dispositivo, um para asociação)
        assert db.commit.call_count >= 1
        db.refresh.assert_called()
        assert result is primeiro_add

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
